import { describe, expect, it } from "vitest";
import { shrinkCaseImage } from "./shrink-case-image";

const MAX_BYTES = 6 * 1024 * 1024;

async function noisyPng() {
  const canvas = document.createElement("canvas");
  canvas.width = 2600;
  canvas.height = 2200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  const pixels = context.createImageData(canvas.width, canvas.height);
  let state = 0x12345678;
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    state = (1664525 * state + 1013904223) >>> 0;
    const value = state >>> 24;
    pixels.data[offset] = value;
    pixels.data[offset + 1] = value;
    pixels.data[offset + 2] = value;
    pixels.data[offset + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG encoding failed."));
        return;
      }
      resolve(new File([blob], "hospital-export.png", { type: "image/png" }));
    }, "image/png");
  });
}

describe("shrinkCaseImage", () => {
  it("shrinks oversized PNGs to JPEGs within the upload limit", async () => {
    const source = await noisyPng();
    expect(source.size).toBeGreaterThan(MAX_BYTES);

    const result = await shrinkCaseImage(source);
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThanOrEqual(MAX_BYTES);
    expect(result.name).toMatch(/\.jpg$/);

    const bitmap = await createImageBitmap(result);
    expect(Math.max(bitmap.width, bitmap.height)).toBeLessThanOrEqual(2048);
    bitmap.close();
  });

  it("returns small files unchanged", async () => {
    const source = new File(["small image"], "small.jpg", { type: "image/jpeg" });
    expect(await shrinkCaseImage(source)).toBe(source);
  });
});
