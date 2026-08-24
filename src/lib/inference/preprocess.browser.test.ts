import { describe, expect, it } from "vitest";
import { preprocessImage } from "./preprocess";

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
});
