import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { expect, test } from "vitest";
import cases from "./cases.json";

test("every bundled case is an intact, decodable frontal JPEG within upload limits", async () => {
  expect(new Set(cases.map((item) => item.sourcePath.split("/")[2])).size).toBe(cases.length);
  for (const item of cases) {
    expect(item.sourcePath).toMatch(/\/valid\/.*frontal.jpg$/);
    const bytes = await readFile(resolve("public", item.imageUrl.slice(1)));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(item.sha256);
    expect(bytes.length).toBeLessThanOrEqual(6 * 1024 * 1024);
    const metadata = await sharp(bytes).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
    expect(Object.keys(item.labels)).toHaveLength(14);
    expect(Object.entries(item.labels)).toContainEqual([item.focus, 1]);
  }
});
