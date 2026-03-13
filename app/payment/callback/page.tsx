import db from "@/lib/db";
import { redirect } from "next/navigation";
import { BillingInterval, PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is missing");
  return key;
}

function getBaseDomainFromEnv() {
  const configured = process.env.BASE_DOMAIN?.trim();
  if (configured) return configured.toLowerCase();
  const publicConfigured = process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim();
  if (publicConfigured) return publicConfigured.toLowerCase();
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.toLowerCase();
  return "";
}

function addInterval(start: Date, interval: BillingInterval) {
  const d = new Date(start.getTime());
  if (interval === BillingInterval.YEARLY) {
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  d.setMonth(d.getMonth() + 1);
  return d;
}

async function verifyPaystackTransaction(reference: string) {
  const secretKey = getPaystackSecretKey();
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    }
  );

  const json = (await response.json()) as any;
  if (!response.ok || !json?.status) {
    const message = typeof json?.message === "string" ? json.message : "Paystack verification failed";
    throw new Error(message);
  }
  return json;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  const ref = (reference ?? "").trim();
  if (!ref) {
    return <div className="p-6">Missing transaction reference.</div>;
  }

  const paymentTransaction = await db.paymentTransaction.findFirst({
    where: { reference: ref },
    include: { subscription: true, hospital: true },
  });

  if (!paymentTransaction) {
    return <div className="p-6">Transaction not found.</div>;
  }

  if (paymentTransaction.status === PaymentTransactionStatus.SUCCESS) {
    const baseDomain = getBaseDomainFromEnv();
    if (baseDomain && paymentTransaction.hospital?.slug) {
      redirect(`https://${paymentTransaction.hospital.slug}.${baseDomain}/sign-in`);
    }
    redirect("/sign-in");
  }

  let verified: any = null;
  try {
    verified = await verifyPaystackTransaction(ref);
  } catch (error) {
    await db.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: { status: PaymentTransactionStatus.FAILED, raw: { error: String(error) } },
    });
    return <div className="p-6">Payment verification failed.</div>;
  }

  const status = String(verified?.data?.status ?? "").toLowerCase();
  const paidAmount = Number(verified?.data?.amount ?? 0);

  const success = status === "success" && paidAmount === paymentTransaction.amount_kobo;

  if (!success) {
    await db.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: { status: PaymentTransactionStatus.FAILED, raw: verified },
    });
    return <div className="p-6">Payment not completed.</div>;
  }

  await db.paymentTransaction.update({
    where: { id: paymentTransaction.id },
    data: { status: PaymentTransactionStatus.SUCCESS, raw: verified },
  });

  if (paymentTransaction.subscription_id) {
    const linked = await db.subscription.findFirst({
      where: { id: paymentTransaction.subscription_id },
      include: { plan: true },
    });
    if (linked) {
      const now = new Date();
      const currentActive = await db.subscription.findFirst({
        where: {
          hospital_id: linked.hospital_id,
          status: SubscriptionStatus.ACTIVE,
          current_period_end: { gt: now },
        },
        orderBy: { current_period_end: "desc" },
        include: { plan: true },
      });

      if (currentActive) {
        const samePlan = currentActive.plan_id === linked.plan_id;
        const sameInterval = currentActive.interval === linked.interval;
        if (samePlan && sameInterval) {
          const base = currentActive.current_period_end ?? now;
          const newEnd = addInterval(base, linked.interval);
          await db.subscription.update({
            where: { id: currentActive.id },
            data: { current_period_end: newEnd },
          });

          await db.subscription.update({
            where: { id: linked.id },
            data: { status: SubscriptionStatus.CANCELLED, cancel_at_period_end: true },
          });

          await db.paymentTransaction.update({
            where: { id: paymentTransaction.id },
            data: { subscription_id: currentActive.id },
          });
        } else {
          const start = currentActive.current_period_end ?? now;
          const end = addInterval(start, linked.interval);
          await db.subscription.update({
            where: { id: linked.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              current_period_start: start,
              current_period_end: end,
            },
          });
        }
      } else {
        const start = now;
        const end = addInterval(start, linked.interval);
        await db.subscription.update({
          where: { id: linked.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            current_period_start: start,
            current_period_end: end,
          },
        });
      }
    }
  }

  const baseDomain = getBaseDomainFromEnv();
  if (baseDomain && paymentTransaction.hospital?.slug) {
    redirect(`https://${paymentTransaction.hospital.slug}.${baseDomain}/sign-in`);
  }
  redirect("/sign-in");
}
