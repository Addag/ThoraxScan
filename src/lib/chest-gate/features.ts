export const CHEST_FEATURE_SIZE = 32;

/**
 * Greyscale 32×32 box average plus a colourfulness score, from raw RGBA.
 * Pure on purpose: the browser (canvas pixels) and the server (sharp raw pixels)
 * both call it, so training, upload checks and Learning Mode see the same features.
 */
export function chestFeatures(rgba: ArrayLike<number>, width: number, height: number) {
  const size = CHEST_FEATURE_SIZE;
  const sums = new Float64Array(size * size);
  const counts = new Uint32Array(size * size);
  let colour = 0;
  for (let y = 0; y < height; y += 1) {
    const row = Math.floor((y * size) / height) * size;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = rgba[index], g = rgba[index + 1], b = rgba[index + 2];
      const bin = row + Math.floor((x * size) / width);
      sums[bin] += 0.299 * r + 0.587 * g + 0.114 * b;
      counts[bin] += 1;
      colour += Math.max(r, g, b) - Math.min(r, g, b);
    }
  }
  const features = new Float32Array(size * size);
  // Images under 32 px leave empty bins; they read as black rather than NaN.
  for (let bin = 0; bin < features.length; bin += 1) features[bin] = counts[bin] ? sums[bin] / counts[bin] / 255 : 0;
  return { features, colourfulness: colour / (width * height * 255), aspect: width / height };
}
