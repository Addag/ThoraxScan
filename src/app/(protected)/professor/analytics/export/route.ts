import type { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth/server";
import { getClassAnalytics } from "@/lib/analytics/server";
import { toCsv } from "@/lib/analytics/summary";

export async function GET(request: NextRequest) {
  const { profile } = await getCurrentProfile();
  if (profile?.role !== "professor" || profile.professor_application_status !== "approved") {
    return new Response("Forbidden", { status: 403 });
  }
  const { searchParams } = request.nextUrl;
  const { data, error } = await getClassAnalytics(profile.id, searchParams.get("workspace") ?? "", searchParams.get("activity") ?? "");
  if (!data) return new Response(error ?? "Analytics are unavailable.", { status: 403 });
  return new Response(toCsv(data.perStudent), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="class-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
