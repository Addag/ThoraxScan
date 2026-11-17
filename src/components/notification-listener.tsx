"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the server-rendered bell current: re-renders the page when an activity or final submission the
 * user can see changes, or when the database announces this Student's feedback was released.
 */
export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // One refresh per burst, e.g. a Professor publishing several activities at once.
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 1000);
    };
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (!userId || cancelled) return;
      await supabase.realtime.setAuth(); // private broadcast topics are authorised by the user's token
      // INSERT/UPDATE only: Realtime does not apply RLS to DELETE events.
      channel = supabase.channel(`notifications:${userId}`, { config: { private: true } });
      for (const table of ["activities", "student_submissions"]) {
        channel
          .on("postgres_changes", { event: "INSERT", schema: "public", table }, refresh)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table }, refresh);
      }
      channel.on("broadcast", { event: "feedback_released" }, refresh).subscribe();
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
