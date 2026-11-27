"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/** Re-renders the application page when an administrator reviews it; the server page redirects once approved. */
export function ApplicationStatusListener({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`professor-application-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "professor_applications", filter: `user_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();
    // Fallback for a dropped socket (sleeping laptop, flaky network).
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
