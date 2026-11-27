const MAX_BYTES = 6 * 1024 * 1024;
const MAX_SIDE = 2048;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

/** Re-encodes JPEG/PNG files over 6 MB as a ≤2048 px JPEG. Returns the original file otherwise or on failure. */
export async function shrinkCaseImage(file: File): Promise<File> {
  if (file.size <= MAX_BYTES || !ACCEPTED_IMAGE_TYPES.has(file.type)) return file;

  let sourceBitmap: ImageBitmap | undefined;
  let resizedBitmap: ImageBitmap | undefined;
  try {
    sourceBitmap = await createImageBitmap(file);
    const { width, height } = sourceBitmap;
    sourceBitmap.close();
    sourceBitmap = undefined;

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const resizeWidth = Math.max(1, Math.round(width * scale));
    const resizeHeight = Math.max(1, Math.round(height * scale));
    resizedBitmap = await createImageBitmap(file, {
      resizeWidth,
      resizeHeight,
      resizeQuality: "high",
    });

    const canvas = document.createElement("canvas");
    canvas.width = resizeWidth;
    canvas.height = resizeHeight;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "white";
    context.fillRect(0, 0, resizeWidth, resizeHeight);
    context.drawImage(resizedBitmap, 0, 0, resizeWidth, resizeHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    if (!blob || blob.size > MAX_BYTES) return file;

    const name = `${file.name.replace(/\.[^.]*$/, "") || "case-image"}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    sourceBitmap?.close();
    resizedBitmap?.close();
  }
}
