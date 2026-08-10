import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Reset password | ThoraxScan",
  description: "Request a ThoraxScan password reset link.",
};

export default function ForgotPasswordPage() {
  return <AuthLayout mode="forgot" />;
}
