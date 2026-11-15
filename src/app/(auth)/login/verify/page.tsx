import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth/auth-layout";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Two-step login | ThoraxScan",
  description: "Enter the code from your authenticator app to finish logging in.",
};

export default async function VerifyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; next?: string }>;
}) {
  // Reads claims directly: getCurrentProfile redirects here, so using it would loop.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) redirect("/login");
  if (data.claims.aal === "aal2") redirect("/dashboard");

  const { as = "", next = "" } = await searchParams;
  return <AuthLayout mode="verify" hiddenFields={{ as, next }} />;
}
