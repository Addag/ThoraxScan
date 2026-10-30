import { describe, expect, it } from "vitest";
import { preprocessRgba, trainingSize } from "./preprocess";

describe("preprocessRgba", () => {
  it("normalizes black and white pixels according to contract version 1", () => {
    const black = preprocessRgba(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1);
    const white = preprocessRgba(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1);
    expect(black).toHaveLength(224 * 224);
    expect(black.every((value) => value === -2)).toBe(true);
    expect(white.every((value) => value === 2)).toBe(true);
  });

  it("uses Rec. 601 luma conversion", () => {
    const red = preprocessRgba(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    expect(red[0]).toBeCloseTo((0.299 - 0.5) / 0.25, 6);
  });

  it("rejects transparency and invalid decoded dimensions", () => {
    expect(() => preprocessRgba(new Uint8ClampedArray([0, 0, 0, 254]), 1, 1)).toThrow(
      /alpha channel/,
    );
    expect(() => preprocessRgba(new Uint8ClampedArray(3), 1, 1)).toThrow(
      /dimensions/,
    );
  });

  it("keeps the single-stage resize unchanged and skips stage 1 for CheXpert-small sizes", () => {
    const small = randomRgba(371, 300, 3);
    expect(preprocessRgba(small, 371, 300, "shortside320-bilinear-center")).toEqual(preprocessRgba(small, 371, 300));
    expect(trainingSize(2828, 2320)).toEqual({ width: 390, height: 320 });
    expect(trainingSize(1751, 2022)).toEqual({ width: 320, height: 369 });
    expect(trainingSize(390, 320)).toEqual({ width: 390, height: 320 });
  });

  it("shrinks large images to short side 320 before the 224 resize", () => {
    const large = randomRgba(640, 800, 4);
    const twoStage = preprocessRgba(large, 640, 800, "shortside320-bilinear-center");
    const oneStage = preprocessRgba(large, 640, 800);
    expect(twoStage).toHaveLength(224 * 224);
    expect(Math.max(...twoStage.map((value, index) => Math.abs(value - oneStage[index])))).toBeGreaterThan(0.01);
  });
});

function randomRgba(width: number, height: number, seed: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  let state = seed;
  for (let index = 0; index < rgba.length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    rgba[index] = index % 4 === 3 ? 255 : state >>> 24;
  }
  return rgba;
}
