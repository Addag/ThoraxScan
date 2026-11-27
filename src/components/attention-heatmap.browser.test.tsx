import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AttentionHeatmap } from "./attention-heatmap";
import { readyAttention, UNAVAILABLE_ATTENTION } from "@/lib/inference/attention";

test("renders the smoothed overlay, controls, legend and accessible values", async () => {
 await render(<AttentionHeatmap imageUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" attention={readyAttention(Array.from({length:49},(_,i)=>i/48))} />);
 expect(document.querySelectorAll("canvas")).toHaveLength(1);
 await page.getByRole("checkbox",{name:"Show heatmap overlay"}).click();
 expect(document.querySelectorAll("canvas")).toHaveLength(0);
 await page.getByRole("checkbox",{name:"Show heatmap overlay"}).click();
 expect(document.querySelectorAll("canvas")).toHaveLength(1);
 await page.getByRole("slider",{name:"Overlay opacity"}).fill("0.8");
 expect((document.querySelector("canvas") as HTMLCanvasElement).style.opacity).toBe("0.8");
 await page.getByText("Method and 7×7 data").click();
 await expect.element(page.getByRole("table")).toBeVisible();
 expect(document.querySelectorAll("td")).toHaveLength(49);
 await expect.element(page.getByText("Lower relative attention → Higher relative attention")).toBeVisible();
});
test("shows V1 unavailable copy without controls", async () => {
 await render(<AttentionHeatmap imageUrl={null} attention={UNAVAILABLE_ATTENTION} />);
 await expect.element(page.getByText("This model release does not export attention data. Prediction results are still available.")).toBeVisible();
 expect(document.querySelector('input[type="range"]')).toBeNull();
});

test("labels hand-picked examples without claiming an inference was run", async () => {
 await render(<AttentionHeatmap imageUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" attention={readyAttention(Array.from({length:49},(_,i)=>i/48))} title="Illustrative example — not model output" illustrative />);
 await expect.element(page.getByRole("heading",{name:"Illustrative example — not model output"})).toBeVisible();
 await expect.element(page.getByRole("img",{name:"Sample chest X-ray for an illustrative attention overlay"})).toBeVisible();
 await expect.element(page.getByText("These values are not model output for this X-ray.",{exact:false})).toBeVisible();
 expect(document.body.textContent).not.toContain("during this inference");
 await page.getByText("Method and 7×7 data").click();
 await expect.element(page.getByText("no attention rollout was run for this example",{exact:false})).toBeVisible();
});

import { readyClassActivation } from "@/lib/inference/attention";
import { THORAXSCAN_LABELS } from "@/lib/inference/contract";
const pixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const cam = readyClassActivation(Array.from({ length: 2744 }, (_, i) => (Math.floor(i / 196) % 2 ? i % 196 : 195 - (i % 196)) / 195));
const camLabels = THORAXSCAN_LABELS.map(label => ({ label, probability: label === "Cardiomegaly" ? 0.8 : label === "Edema" ? 0.9 : 0.05, predicted: label === "Cardiomegaly", possible: label === "Edema" }));

test("per-label maps list likely findings before possible ones, even more probable ones", async () => {
 await render(<AttentionHeatmap imageUrl={pixel} attention={cam} labels={camLabels} title="Finding heatmap" />);
 const select = page.getByRole("combobox", { name: "Finding" });
 await expect.element(select).toHaveValue("Cardiomegaly");
 expect(Array.from(document.querySelectorAll("option")).map(option => option.textContent)).toEqual(["Cardiomegaly (likely, 80.0%)", "Edema (possible, 90.0%)"]);
 await expect.element(page.getByText("evidence for", { exact: false }).first()).toBeVisible();
 await page.getByText("Method and 14×14 data").click();
 expect(document.querySelectorAll("td")).toHaveLength(196);
 const cardiomegalyFirstCell = document.querySelector("td")!.textContent;
 await select.selectOptions("Edema");
 expect(document.querySelector("td")!.textContent).not.toBe(cardiomegalyFirstCell);
 await expect.element(page.getByText("Less evidence for Edema → More evidence for Edema")).toBeVisible();
});

test("per-label maps explain when no finding met its threshold", async () => {
 await render(<AttentionHeatmap imageUrl={pixel} attention={cam} labels={camLabels.map(item => ({ ...item, predicted: false, possible: false }))} title="Finding heatmap" />);
 await expect.element(page.getByText("No finding met its threshold, so there is no finding-specific heatmap to show.")).toBeVisible();
 expect(document.querySelector("canvas")).toBeNull();
});

test("without probabilities every finding can be inspected", async () => {
 await render(<AttentionHeatmap imageUrl={pixel} attention={cam} title="Finding heatmap" />);
 expect(document.querySelectorAll("option")).toHaveLength(13);
 expect(document.body.textContent).not.toContain("%)");
});
