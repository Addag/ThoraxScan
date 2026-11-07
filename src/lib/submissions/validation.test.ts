import { describe, expect, test } from "vitest";
import { normalizeSubmission, validateSubmission } from "./validation";
import { submissionLabel } from "./types";

const blank = { visibleFindings: "", classification: "", relevantRegion: "" };
describe("submission validation", () => {
  test("trims fields and clears normal text", () => {
    expect(normalizeSubmission({ visibleFindings: " \nClear\t", classification: " normal ", relevantRegion: "left" })).toEqual({ visibleFindings: "", classification: "normal", relevantRegion: "" });
    expect(normalizeSubmission({ visibleFindings: " \nOpacity\t", classification: "abnormal", relevantRegion: " left " })).toEqual({ visibleFindings: "Opacity", classification: "abnormal", relevantRegion: "left" });
  });
  test("rejects empty drafts but accepts partial ones", () => {
    expect(validateSubmission(blank, false).classification).toBeTruthy();
    for (const key of Object.keys(blank)) expect(validateSubmission({ ...blank, [key]: key === "classification" ? "abnormal" : "Entered" }, false)).toEqual({});
  });
  test("final requires classification, and findings plus region only when abnormal", () => {
    expect(Object.keys(validateSubmission(blank, true))).toEqual(["classification"]);
    expect(Object.keys(validateSubmission({ ...blank, classification: "abnormal" }, true))).toEqual(["visibleFindings", "relevantRegion"]);
    expect(validateSubmission({ ...blank, visibleFindings: "Opacity", classification: "abnormal" }, true).relevantRegion).toBeTruthy();
    expect(validateSubmission({ ...blank, classification: "normal" }, true)).toEqual({});
  });
  test("enforces exact Unicode character limits and known classification", () => {
    const values = { visibleFindings: "🫁".repeat(5000), classification: "abnormal", relevantRegion: "a".repeat(200) };
    expect(validateSubmission(values, true)).toEqual({});
    expect(Object.keys(validateSubmission({ ...values, visibleFindings: values.visibleFindings + "x", relevantRegion: values.relevantRegion + "x", classification: "other" }, false))).toHaveLength(3);
  });
  test("deadline labels retain submitted status and expire at equality", () => {
    expect(submissionLabel("submitted", "2026-01-01", Date.parse("2026-01-01"))).toBe("Submitted");
    expect(submissionLabel("draft", "2026-01-01", Date.parse("2026-01-01"))).toBe("Deadline passed");
    expect(submissionLabel("draft", null)).toBe("Draft");
    expect(submissionLabel(null, null)).toBe("Not started");
  });
});
