import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { Receipt, CircleDollarSign, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React from "react";

const CashierDashboardPage = async () => {
  await requireAuthUserId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [unpaidCount, todayPaymentsCount, todayInflow, recent] = await Promise.all([
    (db as any).payment.count({ where: { status: { in: ["UNPAID", "PART"] } } }),
    (db as any).payment.count({ where: { payment_date: { gte: startOfDay } } }),
    (db as any).payment.aggregate({
      where: { payment_date: { gte: startOfDay } },
      _sum: { amount_paid: true },
    }),
    (db as any).payment.findMany({
      include: { patient: { select: { first_name: true, last_name: true, hospital_number: true } } },
      orderBy: { payment_date: "desc" },
      take: 5,
    }),
  ]);

  const todayInflowValue = Number(todayInflow?._sum?.amount_paid ?? 0);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Unpaid Bills"
          icon={AlertTriangle}
          note="Bills still pending or partial"
          value={unpaidCount}
          link="/record/billing"
          iconClassName="text-rose-600"
        />
        <StatCard
          title="Payments Today"
          icon={Receipt}
          note="Total payment records today"
          value={todayPaymentsCount}
          link="/cashier/finance/payments"
        />
        <StatCard
          title="Inflow Today"
          icon={CircleDollarSign}
          note="Total amount received today"
          value={todayInflowValue}
          link="/cashier/finance/payments"
          iconClassName="text-emerald-600"
        />
      </div>

      <Card className="border-none shadow-none bg-white">
        <CardHeader>
          <CardTitle>Cashier Dashboard</CardTitle>
          <CardDescription>Manage billing and payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Link className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 text-sm" href="/record/billing">
              Billing overview
            </Link>
            <Link className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-sm" href="/cashier/finance/payments">
              Payments report
            </Link>
            <Link className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm" href="/cashier/finance/payments">
              Finance
            </Link>
          </div>

          <div className="border rounded-lg bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Recent payments</h3>
            </div>
            <div className="divide-y">
              {recent.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No payments yet.</div>
              ) : (
                recent.map((p: any) => {
                  const patientName = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.trim();
                  return (
                    <div key={p.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-medium">Receipt #{p.receipt_number}</div>
                        <div className="text-gray-600">
                          <span className="font-medium">Patient:</span> {patientName}
                          {p.patient?.hospital_number ? (
                            <span className="ml-2 text-xs text-gray-500">{p.patient.hospital_number}</span>
                          ) : null}
                          <span className="ml-4 font-medium">Status:</span> {p.status}
                          <span className="ml-4 font-medium">Paid:</span> {Number(p.amount_paid ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <Link className="text-blue-600 hover:underline text-sm" href="/record/payments">
                        Open
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashierDashboardPage;
