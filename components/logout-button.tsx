"use client";

import React from "react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
  const router = useRouter();

  return (
    <Button
      variant={"outline"}
      className="w-fit bottom-0 gap-2 px-0 md:px-4"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.replace("/sign-in");
        router.refresh();
      }}
    >
      <LogOut />
      <span className="hidden lg:block">Logout</span>
    </Button>
  );
};
