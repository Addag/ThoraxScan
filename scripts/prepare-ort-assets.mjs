import { cp, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageJsonPath = join(dirname(require.resolve("onnxruntime-web")), "..", "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
if (packageJson.version !== "1.27.0") throw new Error(`onnxruntime-web 1.27.0 is required; found ${packageJson.version}.`);
const source = join(dirname(packageJsonPath), "dist");
const destination = join(root, "..", "public", "ort", "1.27.0");
const assets = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"];
await mkdir(destination, { recursive: true });
for (const asset of assets) await cp(join(source, asset), join(destination, asset));
console.log(`Prepared ONNX Runtime Web 1.27.0 assets in ${destination}`);
