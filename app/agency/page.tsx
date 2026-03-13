import db from "@/lib/db";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type PublicPlan = {
  id: number;
  name: string;
  max_admins: number;
  max_staff: number;
  monthly_price_kobo: number;
  yearly_price_kobo: number;
};

async function AgencyLanding() {
  let plans: PublicPlan[] = [];
  try {
    plans = await db.plan.findMany({
      where: { active: true },
      orderBy: { monthly_price_kobo: "asc" },
      select: {
        id: true,
        name: true,
        max_admins: true,
        max_staff: true,
        monthly_price_kobo: true,
        yearly_price_kobo: true,
      },
    });
  } catch {
    plans = [
      { id: 1, name: "Starter", max_admins: 2, max_staff: 10, monthly_price_kobo: 500000, yearly_price_kobo: 5000000 },
      { id: 2, name: "Growth", max_admins: 5, max_staff: 25, monthly_price_kobo: 1500000, yearly_price_kobo: 15000000 },
      { id: 3, name: "Scale", max_admins: 10, max_staff: 100, monthly_price_kobo: 4500000, yearly_price_kobo: 45000000 },
    ];
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Healthcare HMS</div>
          <div className="flex items-center gap-3">
            <Link href="/hospital-signup">
              <Button size="sm">Create hospital</Button>
            </Link>
            <Link href="/sign-in">
              <Button size="sm" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Multi-tenant Hospital Management SaaS
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Run multiple hospitals on one secure platform.
            </h1>
            <p className="text-base text-slate-600">
              Each hospital gets its own tenant workspace, data isolation, and subscription plan. Hospitals can use
              subdomains like <span className="font-medium">hospitalname.mysitedomain.com</span> and later connect a
              custom domain.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/hospital-signup">
                <Button className="h-11 px-5">Get started</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="h-11 px-5">
                  Login
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tenant isolation</CardTitle>
                  <CardDescription>Hospital data stays separated</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Paystack billing</CardTitle>
                  <CardDescription>Monthly and yearly NGN plans</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Role-based access</CardTitle>
                  <CardDescription>Admin, doctor, nurse, more</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Agency controls</CardTitle>
                  <CardDescription>Manage hospitals and subscriptions</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Pricing</div>
                  <div className="text-xl font-semibold">Plans in Naira (NGN)</div>
                </div>
                <div className="text-xs text-slate-500">Monthly / Yearly</div>
              </div>

              <div className="mt-5 grid gap-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-slate-500">
                          {plan.max_admins} admins • {plan.max_staff} staff
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          ₦{(plan.monthly_price_kobo / 100).toLocaleString()}
                          <span className="text-xs font-normal text-slate-500"> /mo</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          ₦{(plan.yearly_price_kobo / 100).toLocaleString()} /yr
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Link href="/hospital-signup">
                  <Button className="w-full">Create hospital and subscribe</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-900 p-6 text-white shadow-sm">
              <div className="text-sm text-slate-200">For SaaS owners</div>
              <div className="mt-1 text-xl font-semibold">Agency dashboard</div>
              <div className="mt-2 text-sm text-slate-200">
                Use the master admin account to track all hospitals, subscriptions, and upcoming expirations.
              </div>
              <div className="mt-4">
                <Link href="/saas/login">
                  <Button variant="secondary" className="w-full">
                    Master admin login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  return <AgencyLanding />;
}
