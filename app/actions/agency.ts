"use server";

import crypto from "crypto";
import dns from "dns/promises";
import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { requireMasterAdmin } from "@/lib/auth";
import { BillingInterval, HospitalDomainType, SubscriptionStatus } from "@prisma/client";

function addInterval(start: Date, interval: BillingInterval) {
  const d = new Date(start.getTime());
  if (interval === BillingInterval.YEARLY) {
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  d.setMonth(d.getMonth() + 1);
  return d;
}

function normalizeHospitalSlug(input: string) {
  const raw = String(input ?? "").trim().toLowerCase();
  const replaced = raw.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-/, "").replace(/-$/, "");
  return replaced;
}

function normalizeDomain(input: string) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";

  const withoutProtocol = raw.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? "";
  const withoutPort = withoutPath.split(":")[0] ?? "";

  const normalized = withoutPort.replace(/^www\./, "");
  return normalized;
}

function createVerificationToken() {
  return crypto.randomBytes(24).toString("base64url");
}

async function verifyDomainToken(domain: string, token: string) {
  const record = `_hms-verification.${domain}`;
  const rows = await dns.resolveTxt(record);
  const flattened = rows.map((parts) => parts.join(""));
  return flattened.some((value) => value.trim() === token.trim());
}

export async function agencySetHospitalActive(formData: FormData) {
  await requireMasterAdmin();

  const hospitalId = Number(formData.get("hospitalId") ?? 0);
  const active = String(formData.get("active") ?? "").trim() === "true";

  if (!Number.isFinite(hospitalId) || hospitalId <= 0) throw new Error("Invalid hospital");

  await db.hospital.update({
    where: { id: hospitalId },
    data: { active },
  });

  revalidatePath("/saas");
}

export async function agencyCreateHospital(formData: FormData) {
  await requireMasterAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeHospitalSlug(String(formData.get("slug") ?? ""));

  if (!name) throw new Error("Name is required");
  if (!slug || slug.length < 2) throw new Error("Invalid slug");

  const existing = await db.hospital.findFirst({ where: { slug }, select: { id: true } });
  if (existing) throw new Error("Slug is already in use");

  await db.hospital.create({
    data: { name, slug, active: true },
  });

  revalidatePath("/saas");
}

export async function agencyUpdateHospital(formData: FormData) {
  await requireMasterAdmin();

  const hospitalId = Number(formData.get("hospitalId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeHospitalSlug(String(formData.get("slug") ?? ""));

  if (!Number.isFinite(hospitalId) || hospitalId <= 0) throw new Error("Invalid hospital");
  if (!name) throw new Error("Name is required");
  if (!slug || slug.length < 2) throw new Error("Invalid slug");

  await db.hospital.update({
    where: { id: hospitalId },
    data: { name, slug },
  });

  revalidatePath("/saas");
  revalidatePath(`/saas/hospitals/${hospitalId}`);
}

export async function agencyDeleteHospital(formData: FormData) {
  await requireMasterAdmin();

  const hospitalId = Number(formData.get("hospitalId") ?? 0);
  if (!Number.isFinite(hospitalId) || hospitalId <= 0) throw new Error("Invalid hospital");

  await db.$transaction([
    db.hospital.update({ where: { id: hospitalId }, data: { active: false } }),
    db.subscription.updateMany({
      where: { hospital_id: hospitalId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELLED, cancel_at_period_end: true },
    }),
  ]);

  revalidatePath("/saas");
  revalidatePath(`/saas/hospitals/${hospitalId}`);
}

export async function agencyChangeHospitalPlan(formData: FormData) {
  await requireMasterAdmin();

  const hospitalId = Number(formData.get("hospitalId") ?? 0);
  const planId = Number(formData.get("planId") ?? 0);
  const intervalRaw = String(formData.get("interval") ?? "MONTHLY").toUpperCase();
  const interval = intervalRaw === "YEARLY" ? BillingInterval.YEARLY : BillingInterval.MONTHLY;

  if (!Number.isFinite(hospitalId) || hospitalId <= 0) throw new Error("Invalid hospital");
  if (!Number.isFinite(planId) || planId <= 0) throw new Error("Invalid plan");

  const [hospital, plan] = await Promise.all([
    db.hospital.findFirst({ where: { id: hospitalId }, select: { id: true } }),
    db.plan.findFirst({ where: { id: planId, active: true } }),
  ]);
  if (!hospital) throw new Error("Hospital not found");
  if (!plan) throw new Error("Plan not found");

  await db.subscription.updateMany({
    where: { hospital_id: hospital.id, status: SubscriptionStatus.ACTIVE },
    data: { status: SubscriptionStatus.CANCELLED, cancel_at_period_end: true },
  });

  const now = new Date();
  await db.subscription.create({
    data: {
      hospital_id: hospital.id,
      plan_id: plan.id,
      interval,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: now,
      current_period_end: addInterval(now, interval),
      cancel_at_period_end: false,
    },
  });

  revalidatePath("/saas");
}

export async function agencyAddHospitalDomain(formData: FormData) {
  await requireMasterAdmin();

  const hospitalId = Number(formData.get("hospitalId") ?? 0);
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));

  if (!Number.isFinite(hospitalId) || hospitalId <= 0) throw new Error("Invalid hospital");
  if (!domain) throw new Error("Domain is required");

  const hospital = await db.hospital.findFirst({ where: { id: hospitalId }, select: { id: true } });
  if (!hospital) throw new Error("Hospital not found");

  const token = createVerificationToken();
  await db.hospitalDomain.create({
    data: {
      hospital_id: hospital.id,
      domain,
      type: HospitalDomainType.CUSTOM,
      verified: false,
      verification_token: token,
    },
  });

  revalidatePath(`/saas/hospitals/${hospital.id}`);
}

export async function agencyRemoveHospitalDomain(formData: FormData) {
  await requireMasterAdmin();

  const domainId = Number(formData.get("domainId") ?? 0);
  if (!Number.isFinite(domainId) || domainId <= 0) throw new Error("Invalid domain");

  const existing = await db.hospitalDomain.findFirst({
    where: { id: domainId },
    select: { id: true, hospital_id: true },
  });
  if (!existing) throw new Error("Domain not found");

  await db.hospitalDomain.delete({ where: { id: existing.id } });
  revalidatePath(`/saas/hospitals/${existing.hospital_id}`);
}

export async function agencyVerifyHospitalDomain(formData: FormData) {
  await requireMasterAdmin();

  const domainId = Number(formData.get("domainId") ?? 0);
  if (!Number.isFinite(domainId) || domainId <= 0) throw new Error("Invalid domain");

  const existing = await db.hospitalDomain.findFirst({
    where: { id: domainId },
    select: { id: true, hospital_id: true, domain: true, verified: true, verification_token: true },
  });
  if (!existing) throw new Error("Domain not found");
  if (existing.verified) {
    revalidatePath(`/saas/hospitals/${existing.hospital_id}`);
    return;
  }
  if (!existing.verification_token) throw new Error("Missing verification token");

  const ok = await verifyDomainToken(existing.domain, existing.verification_token);
  if (!ok) throw new Error("Verification record not found");

  await db.hospitalDomain.update({
    where: { id: existing.id },
    data: { verified: true },
  });

  revalidatePath(`/saas/hospitals/${existing.hospital_id}`);
}
