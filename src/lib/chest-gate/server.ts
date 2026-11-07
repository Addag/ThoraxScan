import sharp from "sharp";
import { chestFeatures } from "./features";

/** Server-side features from the same raw RGBA the browser gets, for upload checks and training dumps. */
export async function chestFeaturesFile(image: Buffer | string) {
  const { data, info } = await sharp(image, { failOn: "warning", limitInputPixels: 40_000_000 })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return chestFeatures(data, info.width, info.height);
}
