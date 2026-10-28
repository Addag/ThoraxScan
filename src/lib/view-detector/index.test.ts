import path from "node:path";
import { expect, test } from "vitest";
import cases from "@/lib/xray-library/cases.json";
import { looksLateral } from ".";

// The 234 official CheXpert validation images were not used to train or tune the detector.
test("view detector rejects no frontal library case and catches lateral ones", async () => {
  const misses: string[] = [];
  for (const item of cases) {
    const lateral = await looksLateral(path.join("public", item.imageUrl));
    if (item.view === "Frontal" && lateral) misses.push(`${item.id} frontal rejected`);
    if (item.view === "Lateral" && !lateral) misses.push(`${item.id} lateral missed`);
  }
  expect(misses).toEqual([]);
});
