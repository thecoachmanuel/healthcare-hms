import { NextRequest, NextResponse } from "next/server";
import { routeAccess } from "./lib/routes";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function matchesRoute(pathname: string, route: string) {
  if (route.endsWith("(.*)")) {
    const prefix = route.replace("(.*)", "");
    return pathname.startsWith(prefix);
  }
  return pathname === route;
}

function normalizeRole(rawRole: string) {
  const role = rawRole.trim().toLowerCase();
  if (role === "lab technician" || role === "lab_technician") return "lab_technician";
  if (role === "lab scientist" || role === "lab_scientist") return "lab_scientist";
  return role;
}

export default async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const role = normalizeRole(
    (user?.app_metadata as { role?: string } | null | undefined)?.role ??
      (user ? "patient" : "sign-in")
  );

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/lab_technician")) {
    return NextResponse.redirect(
      new URL(pathname.replace("/lab_technician", "/lab_scientist"), request.url)
    );
  }

  const matchingRoute = Object.keys(routeAccess).find((route) =>
    matchesRoute(pathname, route)
  );

  if (matchingRoute) {
    const allowedRoles = routeAccess[matchingRoute];
    if (role === "sign-in") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
