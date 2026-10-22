import { expect, onTestFinished, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";

const updateSettings = vi.hoisted(() => vi.fn());
const changePassword = vi.hoisted(() => vi.fn());

vi.mock("@/app/(protected)/settings/actions", () => ({
  changePasswordAction: changePassword,
  updateAccountSettingsAction: updateSettings,
}));

// These component tests run without Next.js's router or build-time environment.
vi.mock("next/link", () => ({
  __esModule: true,
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

import { SettingsForm } from "./settings-form";

const baseProps = {
  email: "student@example.com",
  initialDisplayName: "Ada Student",
  initialSettings: { workPhone: null },
  loadError: null,
  role: "student" as const,
};

test.beforeEach(() => {
  updateSettings.mockReset();
  updateSettings.mockResolvedValue({ status: "success", message: "Settings saved.", savedValues: { displayName: "Ada Student", workPhone: null } });
});

test("starts on Profile and moves tabs with click and keyboard navigation", async () => {
  await render(<SettingsForm {...baseProps} />);

  await expect.element(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
  await expect.element(page.getByText("Update the account details shown throughout your ThoraxScan workspace.")).toBeVisible();
  await page.getByRole("tab", { name: "Privacy" }).click();
  await expect.element(page.getByRole("tab", { name: "Privacy" })).toHaveAttribute("aria-selected", "true");
  await expect.element(page.getByText("Current data handling based on the features that are implemented today.")).toBeVisible();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(page.getByRole("tab", { name: "Security" })).toHaveFocus();
  await expect.element(page.getByRole("heading", { name: "Change password" })).toBeVisible();
  await expect.element(page.getByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  await userEvent.keyboard("{End}");
  await expect.element(page.getByRole("tab", { name: "Accessibility" })).toHaveFocus();
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
  finish({ status: "success", message: "Settings saved.", savedValues: { displayName: "Ada Updated", workPhone: null } });
  await expect.element(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

test("applies text size and high contrast to <html> and remembers them", async () => {
  const root = document.documentElement;
  onTestFinished(() => {
    root.removeAttribute("data-text-size");
    root.removeAttribute("data-contrast");
    localStorage.removeItem("text-size");
    localStorage.removeItem("contrast");
  });
  await render(<SettingsForm {...baseProps} />);
  await page.getByRole("tab", { name: "Accessibility" }).click();
  await expect.element(page.getByRole("button", { name: "Save changes" })).not.toBeInTheDocument();

  await page.getByRole("radio", { name: "Larger" }).click();
  await expect.element(page.getByRole("radio", { name: "Larger" })).toBeChecked();
  expect(root.getAttribute("data-text-size")).toBe("larger");
  expect(localStorage.getItem("text-size")).toBe("larger");
  await page.getByRole("radio", { name: "Default" }).click();
  expect(root.hasAttribute("data-text-size")).toBe(false);

  const contrast = page.getByRole("checkbox", { name: /High contrast/ });
  await contrast.click();
  await expect.element(contrast).toBeChecked();
  expect(root.getAttribute("data-contrast")).toBe("high");
  expect(localStorage.getItem("contrast")).toBe("high");
  await contrast.click();
  await expect.element(contrast).not.toBeChecked();
  expect(root.hasAttribute("data-contrast")).toBe(false);
  // "normal", not removed, so the prefers-contrast fallback doesn't switch it back on.
  expect(localStorage.getItem("contrast")).toBe("normal");
});

test("shows password errors returned by the server", async () => {
  changePassword.mockResolvedValue({ status: "error", message: "Check the highlighted fields.", fieldErrors: { currentPassword: "Current password is incorrect." } });
  await render(<SettingsForm {...baseProps} />);
  await page.getByRole("tab", { name: "Security" }).click();
  await page.getByLabelText("Current password").fill("wrong-password");
  await page.getByLabelText(/^New password/).fill("new-password-1");
  await page.getByLabelText("Confirm new password").fill("new-password-1");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect.element(page.getByText("Current password is incorrect.")).toBeVisible();
  await expect.element(page.getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
});
