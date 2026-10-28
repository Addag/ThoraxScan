import sharp from "sharp";

export const VIEW_FEATURE_SIZE = 32;

// Training and the server check both call this, so the features match exactly.
export async function viewFeatures(image: Buffer | string) {
  const pixels = await sharp(image, { failOn: "warning", limitInputPixels: 40_000_000 })
    .rotate()
    .removeAlpha()
    .greyscale()
    .resize(VIEW_FEATURE_SIZE, VIEW_FEATURE_SIZE, { fit: "fill" })
    .raw()
    .toBuffer();
  const features = new Float32Array(pixels.length);
  for (let index = 0; index < pixels.length; index += 1) features[index] = pixels[index] / 255;
  return features;
}
