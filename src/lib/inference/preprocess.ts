import { MODEL_INPUT_SIZE } from "./contract";
import { InferenceError, asInferenceError } from "./errors";

const MAX_SOURCE_DIMENSION = 8192;
const MAX_SOURCE_PIXELS = 40_000_000;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function sourceCoordinate(target: number, sourceSize: number) {
  return ((target + 0.5) * sourceSize) / MODEL_INPUT_SIZE - 0.5;
}

export function preprocessRgba(
  rgba: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
) {
  if (
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    sourceWidth < 1 ||
    sourceHeight < 1 ||
    rgba.length !== sourceWidth * sourceHeight * 4
  ) {
    throw new InferenceError("PREPROCESSING_FAILED", "Decoded image dimensions are invalid.");
  }

  const grayscale = new Float32Array(sourceWidth * sourceHeight);
  for (let pixel = 0; pixel < sourceWidth * sourceHeight; pixel += 1) {
    const offset = pixel * 4;
    if (rgba[offset + 3] !== 255) {
      throw new InferenceError(
        "PREPROCESSING_FAILED",
        "Images with an alpha channel are not supported by model contract version 1.",
      );
    }
    grayscale[pixel] =
      (0.299 * rgba[offset] + 0.587 * rgba[offset + 1] + 0.114 * rgba[offset + 2]) /
      255;
  }

  const output = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  for (let targetY = 0; targetY < MODEL_INPUT_SIZE; targetY += 1) {
    const sourceY = Math.max(
      0,
      Math.min(sourceHeight - 1, sourceCoordinate(targetY, sourceHeight)),
    );
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const yWeight = sourceY - y0;

    for (let targetX = 0; targetX < MODEL_INPUT_SIZE; targetX += 1) {
      const sourceX = Math.max(
        0,
        Math.min(sourceWidth - 1, sourceCoordinate(targetX, sourceWidth)),
      );
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const xWeight = sourceX - x0;
      const top =
        grayscale[y0 * sourceWidth + x0] * (1 - xWeight) +
        grayscale[y0 * sourceWidth + x1] * xWeight;
      const bottom =
        grayscale[y1 * sourceWidth + x0] * (1 - xWeight) +
        grayscale[y1 * sourceWidth + x1] * xWeight;
      const pixel = top * (1 - yWeight) + bottom * yWeight;

      output[targetY * MODEL_INPUT_SIZE + targetX] = (pixel - 0.5) / 0.25;
    }
  }

  return output;
}

export async function preprocessImage(blob: Blob, signal?: AbortSignal) {
  if (!ACCEPTED_IMAGE_TYPES.has(blob.type)) {
    throw new InferenceError(
      "PREPROCESSING_FAILED",
      "Only JPEG and PNG images are supported.",
    );
  }
  if (blob.size < 1) {
    throw new InferenceError("PREPROCESSING_FAILED", "The selected image is empty.");
  }
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    throw new InferenceError(
      "PREPROCESSING_FAILED",
      "Image preprocessing requires a supported browser.",
    );
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(blob);
    if (
      bitmap.width > MAX_SOURCE_DIMENSION ||
      bitmap.height > MAX_SOURCE_DIMENSION ||
      bitmap.width * bitmap.height > MAX_SOURCE_PIXELS
    ) {
      throw new InferenceError(
        "PREPROCESSING_FAILED",
        "The decoded image dimensions are too large.",
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new InferenceError(
        "PREPROCESSING_FAILED",
        "The browser could not create an image-processing context.",
      );
    }
    context.drawImage(bitmap, 0, 0);
    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
    return preprocessRgba(imageData.data, bitmap.width, bitmap.height);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw asInferenceError(error, "PREPROCESSING_FAILED", "The image could not be preprocessed.");
  } finally {
    bitmap?.close();
  }
}
