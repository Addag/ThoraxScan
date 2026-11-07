import path from "node:path";
import sharp from "sharp";
import { expect, test } from "vitest";
import cases from "@/lib/xray-library/cases.json";
import { passesChestGate } from ".";
import { chestFeaturesFile } from "./server";

const gate = async (image: Buffer | string) => passesChestGate(await chestFeaturesFile(image));

// The 234 official CheXpert validation images were not used to train or tune the gate.
test("chest gate accepts every library case", async () => {
  const rejected: string[] = [];
  for (const item of cases) if (!(await gate(path.join("public", item.imageUrl)))) rejected.push(item.id);
  expect(rejected).toEqual([]);
});

test("chest gate rejects app artwork and a text report", async () => {
  const report = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="600"><rect width="100%" height="100%" fill="white"/>
    <text x="430" y="40" font-size="28" font-weight="bold">RADIOGRAPHIC REPORT</text>
    ${["Type of Exam: XRAY - CHEST PA (ADULT)", "Interpretation", "There are no active lung parenchymal infiltrates.", "The heart is not enlarged.", "The trachea is midline.", "Impression", "No significant chest findings."]
      .map((line, i) => `<text x="40" y="${100 + i * 60}" font-size="20">${line}</text>`).join("")}</svg>`)).png().toBuffer();
  const passed: string[] = [];
  if (await gate(report)) passed.push("text report");
  for (const file of ["thoraxscan-logo.png", "professor-role.png", "student-role.png"]) {
    if (await gate(path.join("public/images", file))) passed.push(file);
  }
  expect(passed).toEqual([]);
});
