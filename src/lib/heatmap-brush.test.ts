import { describe, expect, test } from "vitest";
import { applyStroke, dab, DEFAULT_BRUSH, emptyMask, strokeTo, type Brush } from "./heatmap-brush";

const at = (x: number, y: number) => y * 14 + x;
const marked = (values: number[]) => values.flatMap((value, cell) => (value > 0 ? [cell] : []));
const hard = (size: number): Brush => ({ ...DEFAULT_BRUSH, size, hardness: 1 });

describe("heatmap brush", () => {
  test("a size-1 brush at a cell centre marks only that cell", () => {
    expect(marked(dab(emptyMask(), { x: 5.5, y: 5.5 }, hard(1)))).toEqual([at(5, 5)]);
  });
  test("a larger brush marks a disc", () => {
    const disc = marked(dab(emptyMask(), { x: 7, y: 7 }, hard(4)));
    expect(disc).toContain(at(6, 6));
    expect(disc).toContain(at(8, 8));
    expect(disc).toContain(at(5, 6));
    // Corners of the 4x4 block around (7, 7) are inside; cells two rows away diagonally are not.
    expect(disc).not.toContain(at(4, 4));
    expect(disc.length).toBeGreaterThan(9);
  });
  test("a soft brush fades towards its edge", () => {
    const soft = dab(emptyMask(), { x: 7.5, y: 7.5 }, { ...DEFAULT_BRUSH, size: 8, hardness: 0 });
    expect(soft[at(7, 7)]).toBe(1);
    expect(soft[at(9, 7)]).toBeLessThan(soft[at(8, 7)]);
    expect(soft[at(10, 7)]).toBeLessThan(soft[at(9, 7)]);
    expect(soft[at(10, 7)]).toBeGreaterThan(0);
  });
  test("strength caps a single stroke and further strokes build up", () => {
    const brush = { ...hard(1), strength: 0.3 };
    const dabs = dab(dab(emptyMask(), { x: 2.5, y: 2.5 }, brush), { x: 2.5, y: 2.5 }, brush);
    const first = applyStroke(emptyMask(), dabs, false);
    expect(first[at(2, 2)]).toBe(0.3);
    expect(applyStroke(first, dab(emptyMask(), { x: 2.5, y: 2.5 }, brush), false)[at(2, 2)]).toBe(0.51);
  });
  test("erasing scales values down", () => {
    const full = Array<number>(196).fill(1);
    const erased = applyStroke(full, dab(emptyMask(), { x: 2.5, y: 2.5 }, { ...hard(1), strength: 0.5 }), true);
    expect(erased[at(2, 2)]).toBe(0.5);
    expect(erased[at(3, 3)]).toBe(1);
  });
  test("a fast drag leaves no gaps", () => {
    const line = strokeTo(emptyMask(), { x: 0.5, y: 3.5 }, { x: 13.5, y: 3.5 }, hard(1));
    for (let x = 0; x < 14; x++) expect(line[at(x, 3)]).toBe(1);
  });
  test("specks below 0.01 are dropped", () => {
    const mask = emptyMask();
    mask[at(1, 1)] = 0.004;
    expect(applyStroke(emptyMask(), mask, false)[at(1, 1)]).toBe(0);
  });
});
