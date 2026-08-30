import type { Metadata } from "next";

import { RoleSettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Professor settings | ThoraxScan",
};

export default function ProfessorSettingsPage() {
  return <RoleSettingsPage role="professor" />;
}
