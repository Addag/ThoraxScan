"use server";

import { revalidatePath } from "next/cache";

import type { AdminReviewActionState } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function unauthorizedState(): AdminReviewActionState {
  return {
    status: "unauthorized",
    message: "Administrator access is required.",
  };
}

export async function reviewProfessorApplicationAction(
  _previousState: AdminReviewActionState,
  formData: FormData,
): Promise<AdminReviewActionState> {
  const targetUserId = value(formData, "targetUserId");
  const decision = value(formData, "decision");
  const rejectionReason = value(formData, "rejectionReason");

  if (!uuidPattern.test(targetUserId) || !["approve", "reject"].includes(decision)) {
    return unauthorizedState();
  }

  if (rejectionReason.length > 500) {
    return {
      status: "error",
      message: "Check the rejection reason.",
      fieldErrors: { rejectionReason: "Use 500 characters or fewer." },
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return unauthorizedState();

  const { data: administrator, error: administratorError } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle<{ user_id: string }>();

  if (administratorError || !administrator) return unauthorizedState();

  const { data, error } = await supabase.rpc("review_professor_application", {
    target_user_id: targetUserId,
    decision,
    rejection_reason: rejectionReason || null,
  });

  if (error) {
    return { status: "error", message: "Unable to review the application." };
  }

  if (data === "unauthorized") return unauthorizedState();
  if (data === "email_unconfirmed") {
    return {
      status: "error",
      message: "The applicant must confirm their email before approval.",
    };
  }
  if (data === "has_memberships") {
    return {
      status: "error",
      message: "Remove the applicant's existing workspace memberships before approval.",
    };
  }
  if (data === "reason_too_long") {
    return {
      status: "error",
      message: "Check the rejection reason.",
      fieldErrors: { rejectionReason: "Use 500 characters or fewer." },
    };
  }
  if (["invalid_request", "not_found", "invalid_state"].includes(String(data))) {
    return {
      status: "error",
      message: "This application is no longer available for that action.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/professor/application");

  const approved = data === "approved" || data === "already_approved";
  return {
    status: "success",
    message: approved
      ? "Professor access approved."
      : "Professor application rejected.",
  };
}
