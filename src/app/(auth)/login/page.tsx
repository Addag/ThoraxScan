import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentProfile } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Log in | ThoraxScan",
  description: "Log in to the ThoraxScan educational learning platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  if ((await getCurrentProfile()).authenticated) redirect("/dashboard");
  const { error, message } = await searchParams;

  return (
    <AuthLayout
      mode="login"
      message={error ?? message}
      messageStatus={error ? "error" : "success"}
    />
  );
}
