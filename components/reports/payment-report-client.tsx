"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PaymentStats } from "@/components/charts/payment-stats";

type PaymentRow = {
  receipt_number: number;
  payment_date: string;
  bill_date: string;
  patient_name: string;
  hospital_number?: string | null;
  total_amount: number;
  amount_paid: number;
  discount: number;
  status: string;
  payment_method: string;
  coverage_type: string;
  coverage_reference?: string | null;
  coverage_notes?: string | null;
  payment_reason?: string | null;
};

function toCsv(rows: PaymentRow[]) {
  const header = [
    "receipt_number",
    "payment_date",
    "bill_date",
    "patient_name",
    "hospital_number",
    "total_amount",
    "amount_paid",
    "discount",
    "status",
    "payment_method",
    "coverage_type",
    "coverage_reference",
    "coverage_notes",
    "payment_reason",
  ];
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.receipt_number,
        r.payment_date,
        r.bill_date,
        r.patient_name,
        r.hospital_number ?? "",
        r.total_amount,
        r.amount_paid,
        r.discount,
        r.status,
        r.payment_method,
        r.coverage_type,
        r.coverage_reference ?? "",
        r.coverage_notes ?? "",
        r.payment_reason ?? "",
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export function PaymentReportClient({
  rows,
  daily,
  coverage,
}: {
  rows: PaymentRow[];
  daily: { date: string; amount: number }[];
  coverage: { name: string; value: number }[];
}) {
  const totalInflow = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0),
    [rows]
  );
  const totalDiscount = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.discount || 0), 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-gray-500">Inflow</span>
            <p className="text-lg font-semibold text-emerald-600">{totalInflow.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-500">Discount/Waiver</span>
            <p className="text-lg font-semibold text-yellow-600">{totalDiscount.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const csv = toCsv(rows);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              const html = `
                <html>
                  <head>
                    <title>Payments Report</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 16px; }
                      h1 { font-size: 18px; margin: 0 0 12px; }
                      table { width: 100%; border-collapse: collapse; font-size: 12px; }
                      th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                      th { background: #f3f4f6; }
                    </style>
                  </head>
                  <body>
                    <h1>Payments Report</h1>
                    <table>
                      <thead>
                        <tr>
                          <th>Receipt</th><th>Date</th><th>Patient</th><th>HN</th><th>Total</th><th>Paid</th><th>Discount</th><th>Status</th><th>Method</th><th>Coverage</th><th>Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rows
                          .map(
                            (r) => `
                          <tr>
                            <td>${r.receipt_number}</td>
                            <td>${r.payment_date}</td>
                            <td>${r.patient_name}</td>
                            <td>${r.hospital_number ?? ""}</td>
                            <td>${r.total_amount.toFixed(2)}</td>
                            <td>${r.amount_paid.toFixed(2)}</td>
                            <td>${r.discount.toFixed(2)}</td>
                            <td>${r.status}</td>
                            <td>${r.payment_method}</td>
                            <td>${r.coverage_type}</td>
                            <td>${r.coverage_reference ?? ""}</td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                    <script>window.print();</script>
                  </body>
                </html>
              `;
              w.document.open();
              w.document.write(html);
              w.document.close();
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <PaymentStats daily={daily} coverage={coverage} />
    </div>
  );
}

