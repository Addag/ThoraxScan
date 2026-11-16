import { describe, expect, test } from "vitest";
import { labelsError, normalizeLabels, scoreLabels, toggleLabel } from "./validation";
import { submissionLabel } from "./types";

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
  test("scores correct picks against the key and penalizes wrong extras", () => {
    const key = ["Cardiomegaly", "Edema", "Pleural Effusion"];
    expect(scoreLabels(key, key).score).toBe(100);
    expect(scoreLabels(["Cardiomegaly", "Edema"], key)).toMatchObject({ score: 66.67, missed: ["Pleural Effusion"], extra: [] });
    expect(scoreLabels([...key, "Fracture"], key)).toMatchObject({ score: 75, extra: ["Fracture"] });
    expect(scoreLabels(["No Finding"], key).score).toBe(0);
  });
  test("deadline labels retain submitted status and expire at equality", () => {
    expect(submissionLabel("submitted", "2026-01-01", Date.parse("2026-01-01"))).toBe("Submitted");
    expect(submissionLabel("draft", "2026-01-01", Date.parse("2026-01-01"))).toBe("Deadline passed");
    expect(submissionLabel("draft", null)).toBe("Draft");
    expect(submissionLabel(null, null)).toBe("Not started");
  });
});
