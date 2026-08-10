import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Log in | ThoraxScan",
  description: "Log in to the ThoraxScan educational learning platform.",
};

export default function LoginPage() {
  return <AuthLayout mode="login" />;
}
