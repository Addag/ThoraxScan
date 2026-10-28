// Usage: tsx scripts/dump-view-features.ts <datasetRoot> <csvName> <outPrefix>
// Writes <outPrefix>.f32 (rows x 1024 features) and <outPrefix>.u8 (1 = lateral).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { VIEW_FEATURE_SIZE, viewFeatures } from "../src/lib/view-detector/features";

const [datasetRoot, csvName, outPrefix] = process.argv.slice(2);
if (!datasetRoot || !csvName || !outPrefix) throw new Error("Usage: <datasetRoot> <csvName> <outPrefix>");

const rows = (await readFile(path.join(datasetRoot, csvName), "utf8")).trim().split(/\r?\n/).slice(1);
const width = VIEW_FEATURE_SIZE * VIEW_FEATURE_SIZE;
const features = new Float32Array(rows.length * width);
const labels = new Uint8Array(rows.length);

let next = 0;
async function worker() {
  while (next < rows.length) {
    const index = next++;
    // Path and Frontal/Lateral never contain commas, so a plain split is enough.
    const [csvPath, , , view] = rows[index].split(",");
    const file = path.join(datasetRoot, csvPath.replace(/^[^/]+\//, ""));
    features.set(await viewFeatures(file), index * width);
    labels[index] = view === "Lateral" ? 1 : 0;
    if (index % 10_000 === 0) console.log(`${index}/${rows.length}`);
  }
}
await Promise.all(Array.from({ length: 16 }, worker));

await writeFile(`${outPrefix}.f32`, Buffer.from(features.buffer));
await writeFile(`${outPrefix}.u8`, labels);
console.log(`Wrote ${rows.length} rows (${labels.reduce((sum, value) => sum + value, 0)} lateral) to ${outPrefix}`);
