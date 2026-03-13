import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  options?: { requestHeaders?: Headers }
) {
  let response = NextResponse.next({
    request: {
      headers: options?.requestHeaders ?? request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookieOptions: {
        domain: ((process.env.NEXT_PUBLIC_BASE_DOMAIN ?? process.env.BASE_DOMAIN ?? process.env.VERCEL_URL ?? "").trim()
          ? `.${(process.env.NEXT_PUBLIC_BASE_DOMAIN ?? process.env.BASE_DOMAIN ?? process.env.VERCEL_URL ?? "")
              .trim()
              .replace(/^\./, "")}`
          : undefined) as string | undefined,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}
