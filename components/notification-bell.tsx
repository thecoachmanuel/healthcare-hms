"use client";

import { Bell } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const userIdRef = useRef<string | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      const data = (await res.json()) as { count?: number };
      setCount(Number(data.count ?? 0));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: any = null;
    let interval: any = null;

    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
      refreshCount();

      const userId = userIdRef.current;
      if (userId) {
        channel = supabase
          .channel("notifications:" + userId)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Notification",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              refreshCount();
            }
          )
          .subscribe();
      }
    });

    interval = setInterval(() => {
      refreshCount();
    }, 15000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshCount]);

  return (
    <button
      type="button"
      className="relative"
      aria-label="Notifications"
      onClick={() => router.push("/notifications")}
    >
      <Bell />
      {count > 0 && (
        <span className="absolute -top-3 right-1 min-w-4 h-4 px-1 bg-red-600 text-white rounded-full text-[10px] leading-4 text-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

