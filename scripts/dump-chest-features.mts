// Usage: tsx scripts/dump-chest-features.mts <listFile> <outPrefix>
// <listFile> has one "<label>\t<imagePath>" per line (1 = chest X-ray, 0 = not).
// Writes <outPrefix>.f32 (rows x 1024 features), <outPrefix>.u8 (labels) and
// <outPrefix>.colour.f32 (colourfulness per row).
import { readFile, writeFile } from "node:fs/promises";
import { CHEST_FEATURE_SIZE } from "../src/lib/chest-gate/features";
import { chestFeaturesFile } from "../src/lib/chest-gate/server";

const [listFile, outPrefix] = process.argv.slice(2);
if (!listFile || !outPrefix) throw new Error("Usage: <listFile> <outPrefix>");

const rows = (await readFile(listFile, "utf8")).trim().split(/\r?\n/).map((line) => line.split("\t"));
const width = CHEST_FEATURE_SIZE * CHEST_FEATURE_SIZE;
const features = new Float32Array(rows.length * width);
const colour = new Float32Array(rows.length);
const labels = new Uint8Array(rows.length);

let next = 0;
async function worker() {
  while (next < rows.length) {
    const index = next++;
    const [label, file] = rows[index];
    const result = await chestFeaturesFile(file);
    features.set(result.features, index * width);
    colour[index] = result.colourfulness;
    labels[index] = label === "1" ? 1 : 0;
    if (index % 5_000 === 0) console.log(`${index}/${rows.length}`);
  }
}
await Promise.all(Array.from({ length: 16 }, worker));

await writeFile(`${outPrefix}.f32`, Buffer.from(features.buffer));
await writeFile(`${outPrefix}.colour.f32`, Buffer.from(colour.buffer));
await writeFile(`${outPrefix}.u8`, labels);
console.log(`Wrote ${rows.length} rows (${labels.reduce((sum, value) => sum + value, 0)} chest) to ${outPrefix}`);
