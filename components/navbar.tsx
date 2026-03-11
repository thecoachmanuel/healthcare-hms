"use client";

import { Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import type { Session } from "@supabase/supabase-js";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = React.useState<string | null>(null);
  const [initial, setInitial] = React.useState<string>("U");

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
        <div className="relative">
          <Bell />
          <p className="absolute -top-3 right-1 size-4 bg-red-600 text-white rounded-full text-[10px] text-center">
            2
          </p>
        </div>

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
