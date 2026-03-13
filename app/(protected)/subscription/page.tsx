import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import db, { resolveHospitalIdFromRequest } from "@/lib/db";
import { getRole } from "@/utils/roles";
import { startHospitalSubscriptionCheckout } from "@/app/actions/saas";
import { BillingInterval, SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const role = await getRole();
  const hospitalId = await resolveHospitalIdFromRequest();

  const [hospital, plans, activeSubscription] = await Promise.all([
    db.hospital.findFirst({ where: { id: hospitalId }, select: { name: true, slug: true } }),
    db.plan.findMany({ where: { active: true }, orderBy: { monthly_price_kobo: "asc" } }),
    db.subscription.findFirst({
      where: {
        hospital_id: hospitalId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: { gt: new Date() },
      },
      orderBy: { current_period_end: "desc" },
      include: { plan: true },
    }),
  ]);

  if (role !== "admin") {
    return (
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Subscription required</CardTitle>
            <CardDescription>
              Ask an administrator to activate this hospital subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Hospital: {hospital?.name ?? "Unknown"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage billing for {hospital?.name ?? "this hospital"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSubscription ? (
            <div className="text-sm text-gray-700">
              Active plan: {activeSubscription.plan.name} • Renews on{" "}
              {activeSubscription.current_period_end?.toLocaleDateString() ?? "-"}
            </div>
          ) : (
            <div className="text-sm text-gray-700">No active subscription</div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Choose plan</CardTitle>
          <CardDescription>Select a plan and complete payment via Paystack.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={startHospitalSubscriptionCheckout} className="space-y-4">
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
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">
                Billing interval
                <select
                  name="interval"
                  defaultValue={BillingInterval.MONTHLY}
                  className="ml-2 rounded border px-2 py-1"
                >
                  <option value={BillingInterval.MONTHLY}>Monthly</option>
                  <option value={BillingInterval.YEARLY}>Yearly</option>
                </select>
              </label>
            </div>

            <Button type="submit">Continue to Paystack</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

