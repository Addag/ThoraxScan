import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

const updateSettings = vi.hoisted(() => vi.fn());

vi.mock("@/app/(protected)/settings/actions", () => ({
  updateAccountSettingsAction: updateSettings,
}));

import { SettingsForm } from "./settings-form";

const baseProps = {
  email: "student@example.com",
  initialDisplayName: "Ada Student",
  initialSettings: { workPhone: null, darkImageBackground: true },
  loadError: null,
  role: "student" as const,
};

test.beforeEach(() => {
  updateSettings.mockReset();
  updateSettings.mockResolvedValue({ status: "success", message: "Settings saved.", savedValues: { displayName: "Ada Student", workPhone: null, darkImageBackground: true } });
});

test("starts on Profile and moves tabs with click and keyboard navigation", async () => {
  await render(<SettingsForm {...baseProps} />);

  await expect.element(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
  await expect.element(page.getByText("Update the account details shown throughout your ThoraxScan workspace.")).toBeVisible();
  await page.getByRole("tab", { name: "Display" }).click();
  await expect.element(page.getByRole("tab", { name: "Display" })).toHaveAttribute("aria-selected", "true");
  await expect.element(page.getByText("Choose how teaching-case images are framed in your activity views.")).toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(page.getByRole("tab", { name: "Privacy" })).toHaveFocus();
  await userEvent.keyboard("{Home}");
  await expect.element(page.getByRole("tab", { name: "Profile" })).toHaveFocus();
});

test("renders the Professor-only phone field", async () => {
  await render(<SettingsForm {...baseProps} role="professor" initialSettings={{ ...baseProps.initialSettings, workPhone: "+63 2 8123 4567" }} />);
  await expect.element(page.getByLabelText(/Work phone number/)).toHaveValue("+63 2 8123 4567");
});

test("reports a load error and disables Save", async () => {
  await render(<SettingsForm {...baseProps} loadError="Some account settings could not be loaded." />);
  await expect.element(page.getByText("Some account settings could not be loaded.")).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

test("reports server validation errors", async () => {
  updateSettings.mockResolvedValue({ status: "error", message: "Check the highlighted settings.", fieldErrors: { displayName: "Use between 1 and 100 characters." } });
  await render(<SettingsForm {...baseProps} />);
  await page.getByRole("textbox", { name: "Full name" }).fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.element(page.getByText("Use between 1 and 100 characters.")).toBeVisible();
  await expect.element(page.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true");
});

test("disables controls while saving and returns to clean state after success", async () => {
  let finish!: (value: unknown) => void;
  updateSettings.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  await render(<SettingsForm {...baseProps} />);
  await page.getByLabelText("Full name").fill("Ada Updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.element(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  finish({ status: "success", message: "Settings saved.", savedValues: { displayName: "Ada Updated", workPhone: null, darkImageBackground: true } });
  await expect.element(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

test("toggles display background and submits the updated value", async () => {
  await render(<SettingsForm {...baseProps} />);
  await page.getByRole("tab", { name: "Display" }).click();
  const toggle = page.getByRole("switch", { name: "Dark image background" });
  await toggle.click();
  await expect.element(toggle).not.toBeChecked();
  await page.getByRole("button", { name: "Save changes" }).click();
  const formData = updateSettings.mock.calls.at(-1)?.[1] as FormData;
  expect(formData.get("darkImageBackground")).toBeNull();
});
