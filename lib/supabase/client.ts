import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const baseDomain =
    (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? process.env.BASE_DOMAIN ?? process.env.VERCEL_URL ?? "").trim();
  const cookieDomain = baseDomain ? `.${baseDomain.replace(/^\./, "")}` : undefined;
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    cookieOptions: {
      domain: cookieDomain,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}
