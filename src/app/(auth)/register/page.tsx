import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentProfile } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Create an account | ThoraxScan",
  description: "Create a ThoraxScan educational learning platform account.",
};

export default async function RegisterPage() {
  if ((await getCurrentProfile()).authenticated) redirect("/dashboard");
  return <AuthLayout mode="register" />;
}
