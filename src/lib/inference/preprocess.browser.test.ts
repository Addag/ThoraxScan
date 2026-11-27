import { describe, expect, it } from "vitest";
import { preprocessImage, preprocessRgba } from "./preprocess";

async function pngBlob(red: number, green: number, blue: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
  context.fillRect(0, 0, 1, 1);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed."))), "image/png");
  });
}

describe("browser preprocessing conformance", () => {
  it("decodes and preprocesses a PNG through the browser path", async () => {
    const tensor = await preprocessImage(await pngBlob(255, 255, 255));
    expect(tensor).toHaveLength(224 * 224);
    expect(tensor.every((value) => value === 2)).toBe(true);
  });

  it("applies the short-side-320 resize to large decoded PNGs", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    for (let x = 0; x < 480; x += 2) {
      context.fillStyle = x % 6 === 0 ? "rgb(230, 230, 230)" : "rgb(20, 20, 20)";
      context.fillRect(x, 0, 2, 400);
    }
    const pixels = context.getImageData(0, 0, 480, 400).data;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG encoding failed."))), "image/png");
    });
    const tensor = await preprocessImage(blob, undefined, "shortside320-bilinear-center");
    expect(tensor).toEqual(preprocessRgba(pixels, 480, 400, "shortside320-bilinear-center"));
    expect(tensor).not.toEqual(preprocessRgba(pixels, 480, 400));
  });
});
