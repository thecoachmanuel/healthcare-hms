import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const MASTER_ADMIN_COOKIE_NAME = "hms_master_admin";

type MasterAdminSession = {
  email: string;
  exp: number;
};

function getMasterAdminConfig() {
  const email = (process.env.MASTER_ADMIN_EMAIL ?? "admin@admin.com").trim().toLowerCase();
  const password = process.env.MASTER_ADMIN_PASSWORD ?? "admin123";
  const secret = process.env.MASTER_ADMIN_AUTH_SECRET ?? "dev-secret-change-me";
  return { email, password, secret };
}

function signMasterAdminToken(payloadJson: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payloadJson).digest("base64url");
}

function verifyMasterAdminToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  const expectedSignature = signMasterAdminToken(payloadB64, secret);
  const sigA = Buffer.from(signatureB64, "base64url");
  const sigB = Buffer.from(expectedSignature, "base64url");
  if (sigA.length !== sigB.length) return null;
  if (!crypto.timingSafeEqual(sigA, sigB)) return null;

  let rawPayload: string;
  try {
    rawPayload = Buffer.from(payloadB64, "base64url").toString("utf8");
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
  const exp = Math.floor(p.exp);
  if (!email) return null;
  if (Date.now() > exp * 1000) return null;

  return { email, exp } satisfies MasterAdminSession;
}

export async function getMasterAdminSession(): Promise<MasterAdminSession | null> {
  const { email: configuredEmail, secret } = getMasterAdminConfig();
  const cookieStore = await cookies();
  const token = cookieStore.get(MASTER_ADMIN_COOKIE_NAME)?.value ?? "";
  if (!token) return null;
  const session = verifyMasterAdminToken(token, secret);
  if (!session) return null;
  if (session.email !== configuredEmail) return null;
  return session;
}

export async function setMasterAdminSession(email: string) {
  const { email: configuredEmail, secret } = getMasterAdminConfig();
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized || normalized !== configuredEmail) throw new Error("Unauthorized");

  const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payloadB64 = Buffer.from(JSON.stringify({ e: normalized, exp: expSeconds }), "utf8").toString("base64url");
  const signatureB64 = signMasterAdminToken(payloadB64, secret);
  const token = `${payloadB64}.${signatureB64}`;

  const cookieStore = await cookies();
  cookieStore.set(MASTER_ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearMasterAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(MASTER_ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireMasterAdmin() {
  const session = await getMasterAdminSession();
  if (session) return session;

  const user = await getAuthUser();
  const role = (user?.app_metadata as { role?: string } | null | undefined)?.role ?? "";
  if (user && String(role).trim().toLowerCase() === "master_admin") {
    const email = (user.email ?? "").trim().toLowerCase();
    if (email) return { email, exp: Math.floor(Date.now() / 1000) + 60 } satisfies MasterAdminSession;
  }

  redirect("/saas/login");
}

export function getMasterAdminCredentials() {
  const { email, password } = getMasterAdminConfig();
  return { email, password };
}

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getAuthUserId() {
  const user = await getAuthUser();
  return user?.id ?? null;
}

export async function requireAuthUserId() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}
