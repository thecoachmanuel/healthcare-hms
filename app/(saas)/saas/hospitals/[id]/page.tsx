import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table } from "@/components/tables/table";
import {
  agencyAddHospitalDomain,
  agencyChangeHospitalPlan,
  agencyDeleteHospital,
  agencyRemoveHospitalDomain,
  agencySetHospitalActive,
  agencyUpdateHospital,
  agencyVerifyHospitalDomain,
} from "@/app/actions/agency";
import { requireMasterAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { BillingInterval, PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function getBaseDomainFromEnv() {
  const configured = process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim() || process.env.BASE_DOMAIN?.trim();
  if (configured) return configured.toLowerCase();
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.toLowerCase();
  return "";
}

function formatNairaFromKobo(valueKobo: number) {
  const v = Math.round(valueKobo / 100);
  return `₦${v.toLocaleString()}`;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireMasterAdmin();

  const { id } = await params;
  const hospitalId = Number(id);
  if (!Number.isFinite(hospitalId) || hospitalId <= 0) notFound();

  const [hospital, domains, plans, subscriptions, transactions] = await Promise.all([
    db.hospital.findFirst({
      where: { id: hospitalId },
      select: { id: true, name: true, slug: true, active: true, created_at: true },
    }),
    db.hospitalDomain.findMany({ where: { hospital_id: hospitalId }, orderBy: { created_at: "desc" } }),
    db.plan.findMany({ where: { active: true }, orderBy: { monthly_price_kobo: "asc" } }),
    db.subscription.findMany({
      where: { hospital_id: hospitalId },
      include: { plan: true },
      orderBy: { created_at: "desc" },
      take: 25,
    }),
    db.paymentTransaction.findMany({
      where: { hospital_id: hospitalId },
      orderBy: { created_at: "desc" },
      take: 25,
    }),
  ]);

  if (!hospital) notFound();

  const now = new Date();
  const activeSubscription = subscriptions.find(
    (s) => s.status === SubscriptionStatus.ACTIVE && (s.current_period_end ? s.current_period_end.getTime() > now.getTime() : false),
  );

  const baseDomain = getBaseDomainFromEnv();
  const primaryUrl = baseDomain ? `${hospital.slug}.${baseDomain}` : hospital.slug;

  const domainColumns = [
    { header: "Domain", key: "domain" },
    { header: "Type", key: "type" },
    { header: "Verification", key: "verification" },
    { header: "Actions", key: "actions", className: "text-right" },
  ];

  const subscriptionColumns = [
    { header: "Plan", key: "plan" },
    { header: "Status", key: "status" },
    { header: "Period", key: "period" },
    { header: "Created", key: "created" },
  ];

  const txColumns = [
    { header: "Reference", key: "ref" },
    { header: "Amount", key: "amount" },
    { header: "Status", key: "status" },
    { header: "Created", key: "created" },
  ];

  const statusPill = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === PaymentTransactionStatus.SUCCESS) return "bg-emerald-50 text-emerald-700";
    if (s === PaymentTransactionStatus.FAILED) return "bg-rose-50 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/saas" className="hover:underline">
              Hospitals
            </Link>
            <span className="text-slate-300"> / </span>
            <span className="text-slate-700">{hospital.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{hospital.name}</h1>
          <div className="text-sm text-slate-600">Primary: {primaryUrl}</div>
        </div>

        <div className="flex items-center gap-2">
          <form action={agencySetHospitalActive}>
            <input type="hidden" name="hospitalId" value={hospital.id} />
            <input type="hidden" name="active" value={String(!hospital.active)} />
            <Button variant="outline">{hospital.active ? "Disable hospital" : "Enable hospital"}</Button>
          </form>
          <Link href="/hospital-signup">
            <Button>New hospital</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle>Hospital settings</CardTitle>
            <CardDescription>Update name/subdomain or disable this hospital tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={agencyUpdateHospital} className="grid gap-4">
              <input type="hidden" name="hospitalId" value={hospital.id} />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={hospital.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Subdomain</Label>
                  <Input id="slug" name="slug" defaultValue={hospital.slug} required />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>

            <div className="border-t pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Delete hospital</div>
                  <div className="text-sm text-slate-600">This disables the hospital and cancels active subscriptions.</div>
                </div>
                <form action={agencyDeleteHospital}>
                  <input type="hidden" name="hospitalId" value={hospital.id} />
                  <Button type="submit" variant="outline">Delete</Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Current plan and renewal date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Active plan</div>
                <div className="text-lg font-semibold">
                  {activeSubscription?.plan?.name ?? "No active subscription"}
                </div>
                <div className="text-sm text-slate-600">
                  {activeSubscription?.current_period_end
                    ? `Renews on ${activeSubscription.current_period_end.toLocaleDateString()}`
                    : ""}
                </div>
              </div>

              <form action={agencyChangeHospitalPlan} className="flex items-center gap-2">
                <input type="hidden" name="hospitalId" value={hospital.id} />
                <select
                  name="planId"
                  defaultValue={activeSubscription?.plan_id ?? plans[0]?.id}
                  className="h-10 rounded-md border bg-white px-2 text-sm"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatNairaFromKobo(p.monthly_price_kobo)}/mo)
                    </option>
                  ))}
                </select>
                <select
                  name="interval"
                  defaultValue={activeSubscription?.interval ?? BillingInterval.MONTHLY}
                  className="h-10 rounded-md border bg-white px-2 text-sm"
                >
                  <option value={BillingInterval.MONTHLY}>Monthly</option>
                  <option value={BillingInterval.YEARLY}>Yearly</option>
                </select>
                <Button>Change plan</Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Domains</CardTitle>
            <CardDescription>Add and verify custom domains.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={agencyAddHospitalDomain} className="flex gap-2">
              <input type="hidden" name="hospitalId" value={hospital.id} />
              <input
                name="domain"
                placeholder="clinicdomain.com"
                className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                required
              />
              <Button type="submit">Add</Button>
            </form>

            <div className="text-xs text-slate-600">
              Verification requires a TXT record on the domain: <span className="font-medium">_hms-verification</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Domain mapping</CardTitle>
          <CardDescription>
            Verified custom domains will route into the same hospital tenant. DNS verification is required before routing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={domainColumns}
            data={domains}
            renderRow={(d: any) => (
              <tr key={d.id} className="border-b last:border-b-0">
                <td className="py-4">
                  <div className="font-medium">{d.domain}</div>
                  {!d.verified && d.verification_token ? (
                    <div className="mt-1 text-xs text-slate-600">
                      TXT name: _hms-verification.{d.domain} • value: {d.verification_token}
                    </div>
                  ) : null}
                </td>
                <td className="py-4 text-sm text-slate-700">{String(d.type).toLowerCase()}</td>
                <td className="py-4">
                  <span
                    className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${
                      d.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {d.verified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    {!d.verified ? (
                      <form action={agencyVerifyHospitalDomain}>
                        <input type="hidden" name="domainId" value={d.id} />
                        <Button size="sm" variant="outline">
                          Verify
                        </Button>
                      </form>
                    ) : null}
                    <form action={agencyRemoveHospitalDomain}>
                      <input type="hidden" name="domainId" value={d.id} />
                      <Button size="sm" variant="outline">
                        Remove
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            )}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Subscription history</CardTitle>
            <CardDescription>Latest 25 subscription records for this hospital.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              columns={subscriptionColumns}
              data={subscriptions}
              renderRow={(s: any) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="py-4">
                    <div className="font-medium">{s.plan?.name ?? "—"}</div>
                    <div className="text-xs text-slate-500">
                      {String(s.interval).toLowerCase()} •{" "}
                      {s.plan
                        ? formatNairaFromKobo(
                            s.interval === BillingInterval.YEARLY
                              ? s.plan.yearly_price_kobo
                              : s.plan.monthly_price_kobo,
                          )
                        : "—"}
                    </div>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${
                        s.status === SubscriptionStatus.ACTIVE
                          ? "bg-blue-50 text-blue-700"
                          : s.status === SubscriptionStatus.CANCELLED
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {String(s.status).toLowerCase().replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-700">
                    {s.current_period_start ? s.current_period_start.toLocaleDateString() : "—"} →{" "}
                    {s.current_period_end ? s.current_period_end.toLocaleDateString() : "—"}
                  </td>
                  <td className="py-4 text-sm text-slate-700">{s.created_at.toLocaleDateString()}</td>
                </tr>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Latest 25 payment transactions for this hospital.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              columns={txColumns}
              data={transactions}
              renderRow={(t: any) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="py-4">
                    <div className="font-medium">{t.reference}</div>
                    <div className="text-xs text-slate-500">{String(t.provider).toLowerCase()}</div>
                  </td>
                  <td className="py-4 text-sm text-slate-700">{formatNairaFromKobo(t.amount_kobo)}</td>
                  <td className="py-4">
                    <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${statusPill(t.status)}`}>
                      {String(t.status).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-700">{t.created_at.toLocaleDateString()}</td>
                </tr>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
