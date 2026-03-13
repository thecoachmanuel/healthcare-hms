"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";

import db, { resolveHospitalIdFromRequest } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import {
  BillingInterval,
  PaymentProvider,
  PaymentTransactionStatus,
  Role,
  Status,
  SubscriptionStatus,
} from "@prisma/client";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getAppUrlFromEnvOrHost(host?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/g, "");
  if (!host) return "";
  return `https://${host}`;
}

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is missing");
  return key;
}

async function paystackInitializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const secretKey = getPaystackSecretKey();
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "NGN",
      metadata: params.metadata,
    }),
    cache: "no-store",
  });

  const json = (await response.json()) as any;
  if (!response.ok || !json?.status) {
    const message = typeof json?.message === "string" ? json.message : "Paystack init failed";
    throw new Error(message);
  }

  const authorizationUrl = json?.data?.authorization_url;
  if (typeof authorizationUrl !== "string" || authorizationUrl.length === 0) {
    throw new Error("Paystack authorization_url missing");
  }
  return { authorizationUrl, raw: json };
}

export async function hospitalSignUpAndSubscribe(formData: FormData) {
  const hospitalNameRaw = String(formData.get("hospitalName") ?? "").trim();
  const desiredSlugRaw = String(formData.get("hospitalSlug") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminPhone = String(formData.get("adminPhone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const planId = Number(formData.get("planId") ?? 0);
  const intervalRaw = String(formData.get("interval") ?? "MONTHLY").toUpperCase();

  if (hospitalNameRaw.length < 2) throw new Error("Hospital name is required");
  if (adminName.length < 2) throw new Error("Admin name is required");
  if (adminPhone.length < 7) throw new Error("Admin phone is required");
  if (!email.includes("@")) throw new Error("Valid email is required");
  if (password.trim().length < 8) throw new Error("Password must be at least 8 characters");
  if (!Number.isFinite(planId) || planId <= 0) throw new Error("Please select a plan");
  const interval = intervalRaw === "YEARLY" ? BillingInterval.YEARLY : BillingInterval.MONTHLY;

  const slug = toSlug(desiredSlugRaw || hospitalNameRaw);
  if (slug.length < 3) throw new Error("Subdomain is too short");
  if (slug === "www" || slug === "api" || slug === "admin" || slug === "saas") {
    throw new Error("Subdomain is reserved");
  }

  const existingHospital = await db.hospital.findFirst({ where: { slug }, select: { id: true } });
  if (existingHospital) throw new Error("That subdomain is already taken");

  const plan = await db.plan.findFirst({ where: { id: planId, active: true } });
  if (!plan) throw new Error("Selected plan is not available");

  const amountKobo = interval === BillingInterval.YEARLY ? plan.yearly_price_kobo : plan.monthly_price_kobo;
  if (!Number.isFinite(amountKobo) || amountKobo <= 0) throw new Error("Invalid plan price");

  const supabaseAdmin = createSupabaseAdminClient();
  const [firstName, ...rest] = adminName.split(" ");
  const lastName = rest.join(" ").trim();
  const { data: created, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
    app_metadata: { role: "admin" },
  });
  if (createUserError || !created.user) {
    throw new Error(createUserError?.message ?? "Failed to create admin user");
  }

  const reference = `hms_${crypto.randomUUID().replace(/-/g, "")}`;

  const createdHospital = await db.hospital.create({
    data: {
      name: hospitalNameRaw,
      slug,
      active: true,
    },
    select: { id: true, slug: true, name: true },
  });

  await db.staff.create({
    data: {
      id: created.user.id,
      name: adminName,
      phone: adminPhone,
      email,
      address: "",
      role: Role.ADMIN,
      status: Status.ACTIVE,
      hospital_id: createdHospital.id,
    },
  });

  const subscription = await db.subscription.create({
    data: {
      hospital_id: createdHospital.id,
      plan_id: plan.id,
      interval,
      status: SubscriptionStatus.INCOMPLETE,
    },
    select: { id: true },
  });

  await db.paymentTransaction.create({
    data: {
      hospital_id: createdHospital.id,
      subscription_id: subscription.id,
      provider: PaymentProvider.PAYSTACK,
      reference,
      amount_kobo: amountKobo,
      currency: "NGN",
      status: PaymentTransactionStatus.INITIATED,
    },
  });

  const callbackHost = process.env.BASE_DOMAIN?.trim() || process.env.VERCEL_URL?.trim() || "";
  const callbackUrl = `${getAppUrlFromEnvOrHost(callbackHost)}/payment/callback?reference=${encodeURIComponent(
    reference
  )}`;

  const { authorizationUrl, raw } = await paystackInitializeTransaction({
    email,
    amountKobo,
    reference,
    callbackUrl,
    metadata: {
      hospitalId: createdHospital.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      interval,
      hospitalSlug: createdHospital.slug,
    },
  });

  await db.paymentTransaction.update({
    where: { reference },
    data: { raw },
  });

  redirect(authorizationUrl);
}

export async function getActiveHospitalSubscription() {
  const hospitalId = await resolveHospitalIdFromRequest();
  const now = new Date();
  return db.subscription.findFirst({
    where: {
      hospital_id: hospitalId,
      status: SubscriptionStatus.ACTIVE,
      current_period_end: { gt: now },
    },
    orderBy: { current_period_end: "desc" },
    include: { plan: true },
  });
}

export async function startHospitalSubscriptionCheckout(formData: FormData) {
  await requireAuthUserId();
  const isAdmin = await checkRole(Role.ADMIN);
  if (!isAdmin) throw new Error("Unauthorized");

  const planId = Number(formData.get("planId") ?? 0);
  const intervalRaw = String(formData.get("interval") ?? "MONTHLY").toUpperCase();
  const interval = intervalRaw === "YEARLY" ? BillingInterval.YEARLY : BillingInterval.MONTHLY;

  if (!Number.isFinite(planId) || planId <= 0) throw new Error("Please select a plan");

  const hospitalId = await resolveHospitalIdFromRequest();
  const hospital = await db.hospital.findFirst({ where: { id: hospitalId, active: true } });
  if (!hospital) throw new Error("Hospital not found");

  const plan = await db.plan.findFirst({ where: { id: planId, active: true } });
  if (!plan) throw new Error("Selected plan is not available");

  const amountKobo = interval === BillingInterval.YEARLY ? plan.yearly_price_kobo : plan.monthly_price_kobo;
  if (!Number.isFinite(amountKobo) || amountKobo <= 0) throw new Error("Invalid plan price");

  const authUser = await getAuthUser();
  const payerEmail = authUser?.email ?? "billing@hospital.local";

  const reference = `hms_${crypto.randomUUID().replace(/-/g, "")}`;

  const subscription = await db.subscription.create({
    data: {
      hospital_id: hospital.id,
      plan_id: plan.id,
      interval,
      status: SubscriptionStatus.INCOMPLETE,
    },
    select: { id: true },
  });

  await db.paymentTransaction.create({
    data: {
      hospital_id: hospital.id,
      subscription_id: subscription.id,
      provider: PaymentProvider.PAYSTACK,
      reference,
      amount_kobo: amountKobo,
      currency: "NGN",
      status: PaymentTransactionStatus.INITIATED,
    },
  });

  const callbackHost = process.env.BASE_DOMAIN?.trim() || process.env.VERCEL_URL?.trim() || "";
  const callbackUrl = `${getAppUrlFromEnvOrHost(callbackHost)}/payment/callback?reference=${encodeURIComponent(
    reference
  )}`;

  const { authorizationUrl, raw } = await paystackInitializeTransaction({
    email: payerEmail,
    amountKobo,
    reference,
    callbackUrl,
    metadata: {
      hospitalId: hospital.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      interval,
      hospitalSlug: hospital.slug,
    },
  });

  await db.paymentTransaction.update({
    where: { reference },
    data: { raw },
  });

  redirect(authorizationUrl);
}
