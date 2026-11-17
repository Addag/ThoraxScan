import { describe, expect, test } from "vitest";
import { compareLabels, HEATMAP_LENGTH, labelsError, normalizeAnswers, normalizeLabels, paintedLabels, toggleLabel, unpaintedFindings, validateSubmission } from "./validation";
import { submissionLabel } from "./types";

// A map with one marked cell in each given label's 14x14 slice (label indexes follow the fixed label order).
const mapMarking = (...indexes: number[]) => Array.from({ length: HEATMAP_LENGTH }, (_, cell) => indexes.includes(Math.floor(cell / 196)) && cell % 196 === 0 ? 1 : 0);
const EDEMA = 5, PNEUMONIA = 7;

describe("submission validation", () => {
  test("keeps known labels once, in the fixed order", () => {
    expect(normalizeLabels(["Edema", "Not a label", "Cardiomegaly", "Edema", 7])).toEqual(["Cardiomegaly", "Edema"]);
  });
  test("needs a label, and No Finding stands alone", () => {
    expect(labelsError([])).toBeTruthy();
    expect(labelsError(["No Finding", "Edema"])).toBeTruthy();
    expect(labelsError(["No Finding"])).toBeUndefined();
    expect(labelsError(["Edema", "Pneumonia"])).toBeUndefined();
  });
  test("toggling keeps No Finding exclusive", () => {
    expect(toggleLabel(["Edema"], "No Finding")).toEqual(["No Finding"]);
    expect(toggleLabel(["No Finding"], "Edema")).toEqual(["Edema"]);
    expect(toggleLabel(["Edema", "Pneumonia"], "Edema")).toEqual(["Pneumonia"]);
  });
  test("keeps trimmed answers for selected labels only", () => {
    expect(normalizeAnswers({ Edema: "  Hazy bases \n", Pneumonia: "   ", Fracture: "Not selected", Cardiomegaly: 4 }, ["Edema", "Pneumonia", "Cardiomegaly"])).toEqual({ Edema: "Hazy bases" });
  });
  test("finds which selected findings are painted", () => {
    const map = mapMarking(EDEMA);
    expect(paintedLabels(map, ["Edema", "Pneumonia"])).toEqual(["Edema"]);
    expect(paintedLabels(map, ["Pneumonia"])).toEqual([]);
    expect(paintedLabels(null, ["Edema"])).toEqual([]);
    expect(unpaintedFindings(map, ["No Finding"])).toEqual([]);
    expect(unpaintedFindings(map, ["Edema", "Pneumonia"])).toEqual(["Pneumonia"]);
  });
  test("a final answer needs every finding painted only when the key has maps", () => {
    const values = { labels: ["Edema", "Pneumonia"] as const, answers: {}, heatmap: mapMarking(EDEMA) };
    const answer = { ...values, labels: [...values.labels] };
    expect(validateSubmission(answer, true, true).heatmap).toContain("Pneumonia");
    expect(validateSubmission(answer, false, true)).toEqual({});
    expect(validateSubmission(answer, true, false)).toEqual({});
    expect(validateSubmission({ ...answer, heatmap: mapMarking(EDEMA, PNEUMONIA) }, true, true)).toEqual({});
    expect(validateSubmission({ labels: ["No Finding"], answers: {}, heatmap: null }, true, true)).toEqual({});
  });
  test("limits each written answer to 2,000 characters", () => {
    expect(validateSubmission({ labels: ["Edema"], answers: { Edema: "🫁".repeat(2000) }, heatmap: null }, false, true)).toEqual({});
    expect(validateSubmission({ labels: ["Edema"], answers: { Edema: "x".repeat(2001) }, heatmap: null }, false, true).answers).toContain("Edema");
  });
  test("compares selected labels with the key without scoring", () => {
    expect(compareLabels(["Cardiomegaly", "Fracture"], ["Cardiomegaly", "Edema"])).toEqual({ correct: ["Cardiomegaly"], extra: ["Fracture"], missed: ["Edema"] });
  });
  test("deadline labels retain submitted status and expire at equality", () => {
    expect(submissionLabel("submitted", "2026-01-01", Date.parse("2026-01-01"))).toBe("Submitted");
    expect(submissionLabel("draft", "2026-01-01", Date.parse("2026-01-01"))).toBe("Deadline passed");
    expect(submissionLabel("draft", null)).toBe("Draft");
    expect(submissionLabel(null, null)).toBe("Not started");
  });
});
