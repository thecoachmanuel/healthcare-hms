import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import db, { resolveHospitalIdFromRequest } from "@/lib/db";
import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const role = (h.get("x-user-role") ?? "").trim().toLowerCase();

  const allowWithoutSubscription = pathname.startsWith("/subscription");
  const shouldGate = !allowWithoutSubscription && role !== "master_admin";

  if (shouldGate) {
    const hospitalId = await resolveHospitalIdFromRequest();
    const now = new Date();
    const [active, hospital] = await Promise.all([
      db.subscription.findFirst({
      where: {
        hospital_id: hospitalId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: { gt: now },
      },
      select: { id: true, current_period_end: true },
    }),
      db.hospital.findFirst({ where: { id: hospitalId }, select: { trial_ends_at: true, slug: true } }),
    ]);
    const trialActive = hospital?.trial_ends_at ? hospital.trial_ends_at.getTime() > now.getTime() : false;
    if (!active && !trialActive) redirect("/subscription");
  }

  const hospitalId = await resolveHospitalIdFromRequest();
  const now = new Date();
  const [hospitalForBanner, subForBanner] = await Promise.all([
    db.hospital.findFirst({ where: { id: hospitalId }, select: { slug: true, trial_ends_at: true, name: true } }),
    db.subscription.findFirst({
      where: { hospital_id: hospitalId, status: SubscriptionStatus.ACTIVE, current_period_end: { gt: now } },
      select: { current_period_end: true },
    }),
  ]);
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? process.env.BASE_DOMAIN ?? "";
  const host = hospitalForBanner?.slug && baseDomain ? `${hospitalForBanner.slug}.${baseDomain}` : "";
  const daysLeft = (date?: Date | null) => {
    if (!date) return 0;
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };
  const trialDays = daysLeft(hospitalForBanner?.trial_ends_at ?? null);
  const subDays = daysLeft(subForBanner?.current_period_end ?? null);
  const statusText = subDays > 0 ? `Subscription ${subDays}d left` : trialDays > 0 ? `Trial ${trialDays}d left` : "Inactive";

  return (
    <div className="w-full h-screen flex bg-gray-200">
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%]">
        <Sidebar />
      </div>

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] flex flex-col">
        <Navbar />
        <div className="px-4 py-2 text-xs text-slate-600 border-b bg-white/70">
          <span className="font-medium">Tenant:</span> {hospitalForBanner?.name ?? "Unknown"} {host ? `(${host})` : ""} • {statusText}
          {subDays <= 0 && trialDays <= 0 ? (
            <a className="ml-3 underline" href="/subscription">Manage</a>
          ) : null}
        </div>

        <div className="h-full w-full p-2 overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
};

export default ProtectedLayout;
