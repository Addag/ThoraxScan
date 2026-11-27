import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth/auth-layout";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password | ThoraxScan",
  description: "Choose a new password for your ThoraxScan account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/forgot-password");
  }

  // Supabase refuses a password change until an account with two-step login enters its code.
  if (data.claims.aal !== "aal2") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp.length) redirect("/login/verify?next=/reset-password");
  }

  return <AuthLayout mode="reset" />;
}
