import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";

const reviewAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/(protected)/admin/actions", () => ({
  reviewProfessorApplicationAction: reviewAction,
}));

// These component tests run without Next.js's router or build-time environment.
vi.mock("next/link", () => ({
  __esModule: true,
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

import { ApplicationReviewForm } from "./application-review-form";

const application = {
  user_id: "11111111-1111-4111-8111-111111111111",
  display_name: "Ada Professor",
  email: "ada@example.com",
  email_confirmed: true,
  status: "pending" as const,
  requested_at: "2026-10-20T00:00:00Z",
  reviewed_at: null,
  reviewed_by: null,
  reviewer_name: null,
  rejection_reason: null,
  membership_count: 0,
};

test("asks for confirmation before approving", async () => {
  reviewAction.mockReset();
  reviewAction.mockResolvedValue({ status: "success", message: "Professor access approved." });
  await render(<ApplicationReviewForm application={application} />);

  await page.getByRole("button", { name: "Approve" }).click();
  await expect.element(page.getByRole("dialog", { name: "Approve Professor access?" })).toBeVisible();
  expect(reviewAction).not.toHaveBeenCalled();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  expect(reviewAction).not.toHaveBeenCalled();

  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm approval" }).click();
  await expect.element(page.getByText("Professor access approved.")).toBeVisible();
  const formData = reviewAction.mock.calls[0][1] as FormData;
  expect(formData.get("decision")).toBe("approve");
  expect(formData.get("targetUserId")).toBe(application.user_id);
});
