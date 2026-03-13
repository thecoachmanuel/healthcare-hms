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
  const shouldGate = !allowWithoutSubscription && role !== "patient" && role !== "master_admin";

  if (shouldGate) {
    const hospitalId = await resolveHospitalIdFromRequest();
    const now = new Date();
    const active = await db.subscription.findFirst({
      where: {
        hospital_id: hospitalId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: { gt: now },
      },
      select: { id: true },
    });
    if (!active) redirect("/subscription");
  }

  return (
    <div className="w-full h-screen flex bg-gray-200">
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%]">
        <Sidebar />
      </div>

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] flex flex-col">
        <Navbar />

        <div className="h-full w-full p-2 overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
};

export default ProtectedLayout;
