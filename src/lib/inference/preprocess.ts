import { MODEL_INPUT_SIZE, type ResizeInterpolation } from "./contract";
import { InferenceError, asInferenceError } from "./errors";

const MAX_SOURCE_DIMENSION = 8192;
const MAX_SOURCE_PIXELS = 40_000_000;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

const TRAINING_SHORT_SIDE = 320;

function sourceCoordinate(target: number, sourceSize: number, targetSize: number) {
  return ((target + 0.5) * sourceSize) / targetSize - 0.5;
}

/** Center-aligned bilinear resize without an antialias filter, kept in float64 like the Python reference. */
function resizeBilinear(
  plane: Float32Array | Float64Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const output = new Float64Array(targetWidth * targetHeight);
  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = Math.max(
      0,
      Math.min(sourceHeight - 1, sourceCoordinate(targetY, sourceHeight, targetHeight)),
    );
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const yWeight = sourceY - y0;

    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = Math.max(
        0,
        Math.min(sourceWidth - 1, sourceCoordinate(targetX, sourceWidth, targetWidth)),
      );
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const xWeight = sourceX - x0;
      const top =
        plane[y0 * sourceWidth + x0] * (1 - xWeight) +
        plane[y0 * sourceWidth + x1] * xWeight;
      const bottom =
        plane[y1 * sourceWidth + x0] * (1 - xWeight) +
        plane[y1 * sourceWidth + x1] * xWeight;
      output[targetY * targetWidth + targetX] = top * (1 - yWeight) + bottom * yWeight;
    }
  }
  return output;
}

/** Stage-1 size for "shortside320-bilinear-center": short side 320, long side floored, as CheXpert-small. */
export function trainingSize(width: number, height: number) {
  const shortSide = Math.min(width, height);
  if (shortSide <= TRAINING_SHORT_SIDE) return { width, height };
  return width < height
    ? { width: TRAINING_SHORT_SIDE, height: Math.floor((height * TRAINING_SHORT_SIDE) / width) }
    : { width: Math.floor((width * TRAINING_SHORT_SIDE) / height), height: TRAINING_SHORT_SIDE };
}

export function preprocessRgba(
  rgba: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  interpolation: ResizeInterpolation = "bilinear-center",
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

  let plane: Float32Array | Float64Array = grayscale;
  let width = sourceWidth;
  let height = sourceHeight;
  if (interpolation === "shortside320-bilinear-center") {
    const size = trainingSize(width, height);
    if (size.width !== width || size.height !== height) {
      plane = resizeBilinear(plane, width, height, size.width, size.height);
      ({ width, height } = size);
    }
  }

  const resized = resizeBilinear(plane, width, height, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  return Float32Array.from(resized, (pixel) => (pixel - 0.5) / 0.25);
}

/** Decodes a JPEG or PNG to opaque RGBA pixels with the contract's size limits. */
export async function decodeImage(blob: Blob, signal?: AbortSignal) {
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
    return imageData;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw asInferenceError(error, "PREPROCESSING_FAILED", "The image could not be preprocessed.");
  } finally {
    bitmap?.close();
  }
}

export async function preprocessImage(
  blob: Blob,
  signal?: AbortSignal,
  interpolation: ResizeInterpolation = "bilinear-center",
) {
  const image = await decodeImage(blob, signal);
  return preprocessRgba(image.data, image.width, image.height, interpolation);
}
