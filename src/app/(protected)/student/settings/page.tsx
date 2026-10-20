import type { Metadata } from "next";

import { RoleSettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Student profile | ThoraxScan",
};

export default function StudentSettingsPage() {
  return <RoleSettingsPage role="student" />;
}
