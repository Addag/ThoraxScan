"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { InvitationFormState } from "@/lib/workspaces/types";

const invitationCodePattern = /^[A-Za-z0-9_-]{22}$/;

export async function redeemInvitationAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return {
      status: "error",
      message: "Enter an invitation code.",
      fieldErrors: { code: "Invitation code is required." },
    };
  }

  if (!invitationCodePattern.test(code)) {
    return {
      status: "error",
      message: "This invitation code is not valid.",
      fieldErrors: { code: "Check the code and try again." },
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { status: "unauthorized", message: "Your session has expired. Log in again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single<{ role: string }>();

  if (!profile || profile.role !== "student") {
    return {
      status: "unauthorized",
      message: "This invitation cannot be used by this account.",
    };
  }

  const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
  const { data, error } = await supabase.rpc("redeem_workspace_invitation", {
    code_hash: codeHash,
  });

  if (error) {
    return { status: "error", message: "Unable to join the workspace. Try again." };
  }

  if (data === "joined") {
    revalidatePath("/student");
    return { status: "success", message: "Workspace joined successfully." };
  }

  if (data === "already_member") {
    revalidatePath("/student");
    return { status: "success", message: "You already belong to this workspace." };
  }

  if (data === "expired_code") {
    return { status: "expired", message: "This invitation code has expired." };
  }

  if (data === "revoked_code") {
    return { status: "revoked", message: "This invitation code was revoked." };
  }

  if (data === "unauthorized") {
    return {
      status: "unauthorized",
      message: "This invitation cannot be used by this account.",
    };
  }

  return {
    status: "error",
    message:
      data === "exhausted_code"
        ? "This invitation code has reached its use limit."
        : "This invitation code is not valid.",
  };
}
