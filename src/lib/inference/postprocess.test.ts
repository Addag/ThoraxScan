import { describe, expect, it } from "vitest";
import { analysisReport, postprocessLogits } from "./postprocess";
import { createTestManifest } from "./test-manifest";

describe("postprocessLogits", () => {
  it("uses inclusive thresholds", () => {
    const result = postprocessLogits(Array(14).fill(0), createTestManifest());
    expect(result.labels.every((label) => label.predicted)).toBe(true);
  });

  it("suppresses No Finding when an abnormal finding matches", () => {
    const result = postprocessLogits([1, 1, ...Array(12).fill(-10)], createTestManifest());
    expect(result.findings.map(({ label }) => label)).toEqual([
      "Enlarged Cardiomediastinum",
    ]);
  });

  it("returns an explicit no-match result", () => {
    const result = postprocessLogits(Array(14).fill(-10), createTestManifest());
    expect(result.state).toBe("no-threshold-match");
    expect(result.findings).toEqual([]);
  });

  it("marks abnormal labels between the possible threshold and the threshold as possible", () => {
    const manifest = createTestManifest();
    const tiered = { ...manifest, labels: manifest.labels.map((item) => ({ ...item, threshold: 0.6, possibleThreshold: 0.3 })) };
    // probabilities: No Finding 0.5, Cardiomegaly ~0.88, Edema 0.5, everything else ~0.02
    const logits = tiered.labels.map((_, i) => (i === 0 || i === 5 ? 0 : i === 2 ? 2 : -4));
    const result = postprocessLogits(logits, tiered);
    expect(result.findings.map(({ label }) => label)).toEqual(["Cardiomegaly"]);
    expect(result.possibleFindings.map(({ label }) => label)).toEqual(["Edema"]); // never No Finding
  });

  it("has no possible findings when the release defines no possible thresholds", () => {
    const result = postprocessLogits(Array(14).fill(-0.5), createTestManifest());
    expect(result.possibleFindings).toEqual([]);
  });

  it("rejects non-finite and wrongly shaped output", () => {
    expect(() => postprocessLogits([Number.NaN, ...Array(13).fill(0)], createTestManifest())).toThrow(
      /finite/,
    );
    expect(() => postprocessLogits([0], createTestManifest())).toThrow(/Expected 14 logits/);
  });
});

describe("analysisReport", () => {
  const label = (name: string, probability: number, predicted = false, possible = false) => ({ label: name, probability, predicted, possible });
  const names = ["No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity", "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis", "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"];
  const all = (overrides: Record<string, ReturnType<typeof label>>) => names.map((name) => overrides[name] ?? label(name, 0.05));

  it("writes the normal report when only No Finding matches", () => {
    const report = analysisReport({ state: "predicted", labels: all({ "No Finding": label("No Finding", 0.9, true) }) });
    expect(report.interpretation).toEqual([
      "There are no active lung parenchymal infiltrates.",
      "The heart is not enlarged.",
      "The cardiomediastinal silhouette is within normal limits.",
      "No pleural effusion or pneumothorax is seen.",
      "The osseous structures are unremarkable.",
    ]);
    expect(report.impression).toBe("No significant chest findings.");
    expect(report.exam).toBe("X-ray, chest"); // never claims a view: Learning Mode accepts lateral uploads
  });

  it("names likely findings with percentages and counts possible ones", () => {
    const report = analysisReport({ state: "predicted", labels: all({
      Cardiomegaly: label("Cardiomegaly", 0.82, true),
      Edema: label("Edema", 0.61, true),
      Consolidation: label("Consolidation", 0.74, true),
      "Pleural Effusion": label("Pleural Effusion", 0.3, false, true),
      "Support Devices": label("Support Devices", 0.7, true),
    }) });
    expect(report.interpretation).toContain("The lungs show Edema (61%) and Consolidation (74%).");
    expect(report.interpretation).toContain("The heart appears enlarged: Cardiomegaly (82%).");
    expect(report.interpretation).toContain("No pleural effusion or pneumothorax is seen.");
    expect(report.interpretation).toContain("May also show Pleural Effusion (30%) (possible, check the image).");
    expect(report.interpretation).toContain("Support devices are present.");
    expect(report.impression).toBe("Findings suggest Cardiomegaly, Edema, Consolidation and Support Devices. 1 possible finding needs your review.");
  });

  it("makes no normal claims when nothing met a threshold", () => {
    const report = analysisReport({ state: "no-threshold-match", labels: all({}) });
    expect(report.interpretation).toEqual([]);
    expect(report.impression).toBe("Indeterminate: no finding met its threshold.");
  });
});
