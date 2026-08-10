import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Create an account | ThoraxScan",
  description: "Create a ThoraxScan educational learning platform account.",
};

export default function RegisterPage() {
  return <AuthLayout mode="register" />;
}
