"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import type { Session } from "@supabase/supabase-js";
import { NotificationBell } from "@/components/notification-bell";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<string>("U");
  const [sidebarExpanded, setSidebarExpanded] = React.useState<boolean>(false);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }: { data: { user: Session["user"] | null } }) => {
      const user = data.user;
      setEmail(user?.email ?? null);
      const name =
        (user?.user_metadata as { first_name?: string; last_name?: string }) ??
        {};
      const first = (name.first_name ?? user?.email ?? "U").trim();
      setInitial(first ? first[0]!.toUpperCase() : "U");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setEmail(session?.user.email ?? null);
        const name =
          (session?.user.user_metadata as {
            first_name?: string;
            last_name?: string;
          }) ?? {};
        const first = (name.first_name ?? session?.user.email ?? "U").trim();
        setInitial(first ? first[0]!.toUpperCase() : "U");
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("sidebar-expanded") : null;
    const isMobile = typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false;
    const initial = stored ? stored === "true" : !isMobile;
    setSidebarExpanded(initial);
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-sidebar", initial ? "expanded" : "collapsed");
    }
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        document.body.setAttribute("data-sidebar", next ? "expanded" : "collapsed");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar-expanded", String(next));
      }
      return next;
    });
  }, []);

  function formatPathName(value: string | null): string {
    if (!value) return "Overview";
    const splitRoute = value.split("/");
    const lastIndex = splitRoute.length - 1 > 2 ? 2 : splitRoute.length - 1;

    const pathName = splitRoute[lastIndex];

    const formattedPath = pathName.replace(/-/g, " ");

    return formattedPath;
  }

  const path = formatPathName(pathname);

  return (
    <div className="p-5 flex justify-between bg-white">
      <h1 className="text-xl font-medium text-gray-500 capitalize">
        {path || "Overview"}
      </h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          {sidebarExpanded ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
        <NotificationBell />

        {email && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-9 w-9 rounded-full bg-gray-900 text-white text-sm font-medium flex items-center justify-center"
                aria-label="Account"
              >
                {initial}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Signed in</p>
                  <p className="text-sm text-gray-500 truncate">{email}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const supabase = createSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    router.replace("/sign-in");
                    router.refresh();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
