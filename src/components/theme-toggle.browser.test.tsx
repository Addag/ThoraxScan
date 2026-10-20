import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { ThemeIconButton } from "./theme-toggle";

test("switches <html data-theme> and remembers the choice", async () => {
  await render(<ThemeIconButton />);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(localStorage.getItem("theme")).toBe("light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  expect(localStorage.getItem("theme")).toBe("dark");
});
