import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { expect, test } from "vitest";
import cases from "./cases.json";

test("every bundled case is an intact, decodable JPEG within upload limits", async () => {
  expect(cases).toHaveLength(234);
  expect(cases.filter((item) => item.view === "Frontal")).toHaveLength(202);
  expect(cases.filter((item) => item.view === "Lateral")).toHaveLength(32);
  expect(new Set(cases.map((item) => item.sourcePath)).size).toBe(cases.length);
  for (const item of cases) {
    expect(item.sourcePath).toMatch(/\/valid\/.*\.jpe?g$/);
    expect(item.sourcePath).toContain(item.view.toLowerCase());
    const bytes = await readFile(resolve("public", item.imageUrl.slice(1)));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(item.sha256);
    expect(bytes.length).toBeLessThanOrEqual(6 * 1024 * 1024);
    const metadata = await sharp(bytes).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
    expect(Object.keys(item.labels)).toHaveLength(14);
  }
});
