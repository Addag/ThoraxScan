import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { useEffect, useState } from "react";
import { HeatmapPainter } from "./heatmap-painter";
import type { ActivityAILabel } from "@/lib/activity-ai/types";

const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const EDEMA = 5 * 196, PNEUMONIA = 7 * 196;
// The painter's latest values, read by the assertions.
const painted = { current: [] as number[] };

function Harness({ labels = ["Edema", "Pneumonia"] }: { labels?: ActivityAILabel[] }) {
  const [values, setValues] = useState<number[]>(Array(2744).fill(0));
  useEffect(() => { painted.current = values; }, [values]);
  return <HeatmapPainter imageUrl={imageUrl} labels={labels} values={values} onChange={setValues} />;
}
const press = (key: string, init: KeyboardEventInit = {}) =>
  page.getByRole("application").element().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
const setSlider = (name: string, value: number) => {
  const input = page.getByRole("slider", { name }).element() as HTMLInputElement;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const marked = (from: number) => painted.current.slice(from, from + 196).filter((value) => value > 0).length;

test("the size and strength sliders change what a dab paints", async () => {
  await render(<Harness />);
  setSlider("Size", 1);
  setSlider("Strength", 0.4);
  await expect.element(page.getByText("1 cell", { exact: true })).toBeVisible();
  press(" ");
  await expect.poll(() => painted.current[EDEMA]).toBe(0.4);
  expect(marked(EDEMA)).toBe(1);
  setSlider("Size", 6);
  setSlider("Strength", 1);
  press(" ");
  await expect.poll(() => marked(EDEMA)).toBeGreaterThan(4);
  expect(painted.current[EDEMA]).toBe(1);
});

test("undo and redo step through strokes, and undo starts disabled", async () => {
  await render(<Harness />);
  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });
  await expect.element(undo).toBeDisabled();
  press(" ");
  await expect.poll(() => painted.current[EDEMA]).toBe(1);
  await undo.click();
  await expect.poll(() => painted.current[EDEMA]).toBe(0);
  await expect.element(redo).toBeEnabled();
  await redo.click();
  await expect.poll(() => painted.current[EDEMA]).toBe(1);
  press("z", { ctrlKey: true });
  await expect.poll(() => painted.current[EDEMA]).toBe(0);
  press("z", { ctrlKey: true, shiftKey: true });
  await expect.poll(() => painted.current[EDEMA]).toBe(1);
});

test("clear empties only the current finding", async () => {
  await render(<Harness />);
  press(" ");
  await page.getByRole("combobox", { name: "Finding" }).selectOptions("Pneumonia");
  press(" ");
  await expect.poll(() => painted.current[PNEUMONIA]).toBe(1);
  await page.getByRole("button", { name: "Clear this finding" }).click();
  await expect.poll(() => marked(PNEUMONIA)).toBe(0);
  expect(painted.current[EDEMA]).toBe(1);
});

test("bracket keys resize the brush and E erases", async () => {
  await render(<Harness />);
  press("]");
  press("]");
  await expect.element(page.getByText("4 cells", { exact: true })).toBeVisible();
  press("[");
  await expect.element(page.getByText("3 cells", { exact: true })).toBeVisible();
  press(" ");
  await expect.poll(() => painted.current[EDEMA]).toBe(1);
  press("e");
  await expect.element(page.getByRole("radio", { name: "Erase" })).toBeChecked();
  press(" ");
  await expect.poll(() => painted.current[EDEMA]).toBe(0);
});
