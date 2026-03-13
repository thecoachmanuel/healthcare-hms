import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import db from "@/lib/db";
import { hospitalSignUpAndSubscribe } from "@/app/actions/saas";
import { BillingInterval } from "@prisma/client";

export const dynamic = "force-dynamic";

type PlanForUi = {
  id: number;
  name: string;
  monthly_price_kobo: number;
  yearly_price_kobo: number;
  max_admins: number;
  max_staff: number;
  max_patients?: number;
};

export default async function Page() {
  let plans: PlanForUi[] = [];
  try {
    plans = await db.plan.findMany({
      where: { active: true },
      orderBy: { monthly_price_kobo: "asc" },
      select: {
        id: true,
        name: true,
        monthly_price_kobo: true,
        yearly_price_kobo: true,
        max_admins: true,
        max_staff: true,
        // max_patients may not exist on older DBs; selecting it will throw. We'll add via a safe try.
      },
    });
    // Attempt to load max_patients if available
    try {
      const withMax = await db.plan.findMany({
        where: { active: true },
        orderBy: { monthly_price_kobo: "asc" },
        select: {
          id: true,
          max_patients: true,
        },
      });
      const map = new Map(withMax.map((p) => [p.id, p.max_patients as number | null | undefined]));
      plans = plans.map((p) => ({ ...p, max_patients: map.get(p.id) ?? undefined }));
    } catch {}
  } catch {
    plans = [
      { id: 1, name: "Starter", monthly_price_kobo: 500000, yearly_price_kobo: 5000000, max_admins: 2, max_staff: 10, max_patients: 1000 },
      { id: 2, name: "Growth", monthly_price_kobo: 1500000, yearly_price_kobo: 15000000, max_admins: 5, max_staff: 25, max_patients: 5000 },
      { id: 3, name: "Scale", monthly_price_kobo: 4500000, yearly_price_kobo: 45000000, max_admins: 10, max_staff: 100, max_patients: 20000 },
    ];
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create your hospital workspace</CardTitle>
          <CardDescription>
            Set up a new hospital tenant and activate a subscription via Paystack.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={hospitalSignUpAndSubscribe} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital name</Label>
                <Input id="hospitalName" name="hospitalName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalSlug">Subdomain</Label>
                <Input id="hospitalSlug" name="hospitalSlug" placeholder="e.g. st-marys" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin name</Label>
                <Input id="adminName" name="adminName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Admin phone</Label>
                <Input id="adminPhone" name="adminPhone" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Plan</div>
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className="flex items-start gap-3 rounded-md border bg-white p-3 cursor-pointer"
                  >
                    <input type="radio" name="planId" value={plan.id} required />
                    <div className="flex-1">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-600">
                        Monthly: ₦{(plan.monthly_price_kobo / 100).toLocaleString()} • Yearly: ₦
                        {(plan.yearly_price_kobo / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Limits: {plan.max_admins} admins • {plan.max_staff} staff
                        {" "}
                        {typeof plan.max_patients === "number" ? <> • {plan.max_patients} patients</> : null}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm text-gray-700">
                Billing interval
                <select
                  name="interval"
                  defaultValue={BillingInterval.MONTHLY}
                  className="ml-2 rounded border px-2 py-1"
                >
                  <option value={BillingInterval.MONTHLY}>Monthly</option>
                  <option value={BillingInterval.YEARLY}>Yearly</option>
                </select>
              </Label>
            </div>

            <Button type="submit" className="w-full">Continue to Paystack</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
