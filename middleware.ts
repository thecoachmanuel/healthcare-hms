import { NextRequest, NextResponse } from "next/server";
import { routeAccess } from "./lib/routes";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const MASTER_ADMIN_COOKIE_NAME = "hms_master_admin";

function getMasterAdminConfig() {
  const email = (process.env.MASTER_ADMIN_EMAIL ?? "admin@admin.com").trim().toLowerCase();
  const secret = process.env.MASTER_ADMIN_AUTH_SECRET ?? "dev-secret-change-me";
  return { email, secret };
}

function base64UrlToBytes(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bytes = Uint8Array.from(atob(b64 + pad), (c) => c.charCodeAt(0));
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const u8 = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i += 1) s += String.fromCharCode(u8[i] ?? 0);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function verifyMasterAdminCookie(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  const { email: configuredEmail, secret } = getMasterAdminConfig();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const expectedSigB64 = bytesToBase64Url(expectedSig);
  if (expectedSigB64 !== signatureB64) return null;

  let rawPayload: string;
  try {
    rawPayload = new TextDecoder().decode(base64UrlToBytes(payloadB64));
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return null;
  }

  const p = parsed as Partial<{ e: string; exp: number }>;
  if (!p || typeof p.e !== "string" || typeof p.exp !== "number") return null;
  if (!Number.isFinite(p.exp)) return null;

  const email = p.e.trim().toLowerCase();
  const expMs = Math.floor(p.exp) * 1000;
  if (!email || email !== configuredEmail) return null;
  if (Date.now() > expMs) return null;

  return { email };
}

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
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-host", host.split(":")[0].toLowerCase());

  const masterToken = request.cookies.get(MASTER_ADMIN_COOKIE_NAME)?.value ?? "";
  const masterSession = masterToken ? await verifyMasterAdminCookie(masterToken) : null;
  if (masterSession) requestHeaders.set("x-user-role", "master_admin");

  const { supabase, response: supabaseResponse } = createSupabaseMiddlewareClient(request, { requestHeaders });
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const role = masterSession
    ? "master_admin"
    : normalizeRole((user?.app_metadata as { role?: string } | null | undefined)?.role ?? (user ? "patient" : "sign-in"));

  requestHeaders.set("x-user-role", role);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  function applySupabaseCookies(nextResponse: NextResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      nextResponse.cookies.set(cookie);
    });
    return nextResponse;
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/lab_technician")) {
    return applySupabaseCookies(
      NextResponse.redirect(
      new URL(pathname.replace("/lab_technician", "/lab_scientist"), request.url)
      )
    );
  }

  const matchingRoute = Object.keys(routeAccess).find((route) =>
    matchesRoute(pathname, route)
  );

  if (matchingRoute) {
    const allowedRoles = routeAccess[matchingRoute];
    if (role === "sign-in" && !allowedRoles.includes("sign-in")) {
      return applySupabaseCookies(
        NextResponse.redirect(new URL("/sign-in", request.url))
      );
    }

    if (!allowedRoles.includes(role)) {
      return applySupabaseCookies(
        NextResponse.redirect(new URL(role === "master_admin" ? "/saas" : `/${role}`, request.url))
      );
    }
  }

  return applySupabaseCookies(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  );
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
