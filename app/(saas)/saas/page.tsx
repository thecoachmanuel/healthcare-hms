import db from "@/lib/db";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table } from "@/components/tables/table";
import { agencyChangeHospitalPlan, agencyCreateHospital, agencySetHospitalActive } from "@/app/actions/agency";
import { requireMasterAdmin } from "@/lib/auth";
import { BillingInterval, Role, SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatNairaFromKobo(valueKobo: number) {
  const v = Math.round(valueKobo / 100);
  return `₦${v.toLocaleString()}`;
}

function daysUntil(date?: Date | null) {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default async function Page() {
  await requireMasterAdmin();

  const [hospitals, plans, subscriptions, staffTotals, adminTotals] = await Promise.all([
    db.hospital.findMany({
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, slug: true, active: true, created_at: true },
    }),
    db.plan.findMany({ where: { active: true }, orderBy: { monthly_price_kobo: "asc" } }),
    db.subscription.findMany({
      orderBy: [{ hospital_id: "asc" }, { current_period_end: "desc" }, { id: "desc" }],
      include: { plan: true },
    }),
    db.staff.groupBy({
      by: ["hospital_id"],
      _count: { _all: true },
    }),
    db.staff.groupBy({
      by: ["hospital_id"],
      where: { role: Role.ADMIN },
      _count: { _all: true },
    }),
  ]);

  const latestSubscriptionByHospital = new Map<number, typeof subscriptions[number]>();
  for (const s of subscriptions) {
    if (!latestSubscriptionByHospital.has(s.hospital_id)) latestSubscriptionByHospital.set(s.hospital_id, s);
  }

  const staffTotalByHospital = new Map<number, number>();
  for (const row of staffTotals) staffTotalByHospital.set(row.hospital_id, row._count._all);

  const adminTotalByHospital = new Map<number, number>();
  for (const row of adminTotals) adminTotalByHospital.set(row.hospital_id, row._count._all);

  const now = new Date();

  let activeSubs = 0;
  let expiringSoon = 0;
  let mrrKobo = 0;

  for (const s of latestSubscriptionByHospital.values()) {
    const active =
      s.status === SubscriptionStatus.ACTIVE &&
      (s.current_period_end ? s.current_period_end.getTime() > now.getTime() : false);

    if (active) {
      activeSubs += 1;
      const interval = s.interval;
      const p = s.plan;
      mrrKobo +=
        interval === BillingInterval.YEARLY
          ? Math.floor(p.yearly_price_kobo / 12)
          : p.monthly_price_kobo;
      const d = daysUntil(s.current_period_end);
      if (d != null && d >= 0 && d <= 7) expiringSoon += 1;
    }
  }

  const arrKobo = mrrKobo * 12;

  const columns = [
    { header: "Hospital", key: "hospital" },
    { header: "Status", key: "status" },
    { header: "Subscription", key: "subscription" },
    { header: "Usage", key: "usage" },
    { header: "Actions", key: "actions", className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">SaaS master admin</div>
          <h1 className="text-2xl font-semibold tracking-tight">Hospitals overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hospital-signup">
            <Button>New hospital</Button>
          </Link>
          <Link href="/agency">
            <Button variant="outline">View landing</Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create hospital</CardTitle>
          <CardDescription>Create a hospital tenant directly from the agency console.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={agencyCreateHospital} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Hospital name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain</Label>
              <Input id="slug" name="slug" placeholder="e.g. st-marys" required />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total hospitals</CardDescription>
            <CardTitle className="text-2xl">{hospitals.length.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active subscriptions</CardDescription>
            <CardTitle className="text-2xl">{activeSubs.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Expiring in 7 days</CardDescription>
            <CardTitle className="text-2xl">{expiringSoon.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>MRR / ARR</CardDescription>
            <CardTitle className="text-2xl">
              {formatNairaFromKobo(mrrKobo)}
              <span className="text-sm font-normal text-slate-500"> /mo</span>
            </CardTitle>
            <CardContent className="px-0 pt-2">
              <div className="text-xs text-slate-500">ARR {formatNairaFromKobo(arrKobo)} /yr</div>
            </CardContent>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Hospitals</CardTitle>
          <CardDescription>Track plan status, usage limits, and upcoming expirations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={hospitals}
            renderRow={(hospital: any) => {
              const sub = latestSubscriptionByHospital.get(hospital.id) ?? null;
              const active =
                sub?.status === SubscriptionStatus.ACTIVE &&
                (sub?.current_period_end ? sub.current_period_end.getTime() > now.getTime() : false);
              const expiresIn = daysUntil(sub?.current_period_end ?? null);

              const staffCount = staffTotalByHospital.get(hospital.id) ?? 0;
              const adminCount = adminTotalByHospital.get(hospital.id) ?? 0;
              const plan = sub?.plan ?? null;

              const statusPill = active
                ? "bg-emerald-50 text-emerald-700"
                : sub?.status === SubscriptionStatus.PAST_DUE
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700";

              return (
                <tr key={hospital.id} className="border-b last:border-b-0">
                  <td className="py-4">
                    <Link href={`/saas/hospitals/${hospital.id}`} className="font-medium hover:underline">
                      {hospital.name}
                    </Link>
                    <div className="text-xs text-slate-500">{hospital.slug}</div>
                  </td>

                  <td className="py-4">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${statusPill}`}>
                        {hospital.active ? "Active" : "Disabled"}
                      </span>
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${
                          active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {active ? "Subscribed" : "No active subscription"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4">
                    {plan ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{plan.name}</div>
                        <div className="text-xs text-slate-500">
                          {sub?.interval === BillingInterval.YEARLY ? "Yearly" : "Monthly"} •{" "}
                          {sub?.current_period_end
                            ? `renews ${sub.current_period_end.toLocaleDateString()}`
                            : "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {expiresIn != null ? `in ${expiresIn}d` : ""}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">—</div>
                    )}
                  </td>

                  <td className="py-4">
                    <div className="text-sm text-slate-700">
                      {adminCount} admin{adminCount === 1 ? "" : "s"} • {staffCount} staff
                    </div>
                    {plan ? (
                      <div className="text-xs text-slate-500">
                        Limits: {plan.max_admins} admins • {plan.max_staff} staff
                      </div>
                    ) : null}
                  </td>

                  <td className="py-4 text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <form action={agencySetHospitalActive} className="inline-flex">
                        <input type="hidden" name="hospitalId" value={hospital.id} />
                        <input type="hidden" name="active" value={String(!hospital.active)} />
                        <Button size="sm" variant="outline">
                          {hospital.active ? "Disable" : "Enable"}
                        </Button>
                      </form>

                      <form action={agencyChangeHospitalPlan} className="inline-flex items-center gap-2">
                        <input type="hidden" name="hospitalId" value={hospital.id} />
                        <select
                          name="planId"
                          defaultValue={plan?.id ?? plans[0]?.id}
                          className="h-9 rounded-md border bg-white px-2 text-sm"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select name="interval" defaultValue={BillingInterval.MONTHLY} className="h-9 rounded-md border bg-white px-2 text-sm">
                          <option value={BillingInterval.MONTHLY}>Monthly</option>
                          <option value={BillingInterval.YEARLY}>Yearly</option>
                        </select>
                        <Button size="sm">Set plan</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
