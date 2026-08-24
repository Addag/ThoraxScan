import { describe, expect, it } from "vitest";
import { preprocessRgba } from "./preprocess";

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
});
