import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AttentionHeatmap } from "./attention-heatmap";
import { readyAttention, UNAVAILABLE_ATTENTION } from "@/lib/inference/attention";

test("renders 49 aligned cells, controls, legend and accessible values", async () => {
 await render(<AttentionHeatmap imageUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" attention={readyAttention(Array.from({length:49},(_,i)=>i/48))} />);
 expect(document.querySelectorAll("svg rect")).toHaveLength(49);
 await page.getByRole("checkbox",{name:"Show attention overlay"}).click();
 expect(document.querySelectorAll("svg rect")).toHaveLength(0);
 await page.getByRole("checkbox",{name:"Show attention overlay"}).click();
 expect(document.querySelectorAll("svg rect")).toHaveLength(49);
 await page.getByRole("slider",{name:"Overlay opacity"}).fill("0.8");
 expect((document.querySelector("svg") as SVGElement).style.opacity).toBe("0.8");
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
