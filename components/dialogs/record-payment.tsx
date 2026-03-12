"use client";

import { markPatientBillPaid } from "@/app/actions/medical";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { BillPaymentSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Card", value: "CARD" },
];

export function RecordPayment({
  bills,
}: {
  bills: {
    id: number;
    total_cost: number;
    amount_paid?: number;
    payment_status?: string;
    service?: { service_name: string };
  }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const billOptions = useMemo(() => {
    return bills
      .filter((b) => (b.payment_status ?? "UNPAID") !== "PAID")
      .map((b) => {
        const remaining = Math.max(0, Number(b.total_cost) - Number(b.amount_paid ?? 0));
        return {
          label: `${b.service?.service_name ?? "Service"} — due ${remaining.toFixed(2)}`,
          value: String(b.id),
        };
      });
  }, [bills]);

  const form = useForm<z.infer<typeof BillPaymentSchema>>({
    resolver: zodResolver(BillPaymentSchema),
    defaultValues: {
      patient_bill_id: billOptions[0]?.value ?? "",
      amount_paid: "0.00",
      payment_method: "CASH",
      coverage_type: "NONE",
      coverage_notes: "",
      coverage_reference: "",
      payment_reason: "",
    },
  });

  const selectedBillId = form.watch("patient_bill_id");

  useEffect(() => {
    if (!selectedBillId) return;
    const bill = bills.find((b) => String(b.id) === String(selectedBillId));
    if (!bill) return;
    const remaining = Math.max(0, Number(bill.total_cost) - Number(bill.amount_paid ?? 0));
    form.setValue("amount_paid", remaining.toFixed(2));
  }, [selectedBillId, bills, form]);

  const handleSubmit = async (values: z.infer<typeof BillPaymentSchema>) => {
    try {
      setLoading(true);
      const res = await markPatientBillPaid(values);
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
        setOpen(false);
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (billOptions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CreditCard size={16} className="text-gray-500" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <CustomInput
              type="select"
              control={form.control}
              name="patient_bill_id"
              label="Item being paid for"
              placeholder="Select item"
              selectList={billOptions}
            />

            <CustomInput
              type="input"
              control={form.control}
              name="amount_paid"
              label="Amount paid"
              placeholder="0.00"
            />

            <CustomInput
              type="select"
              control={form.control}
              name="payment_method"
              label="Payment method"
              placeholder="Select method"
              selectList={PAYMENT_METHODS}
            />

            <CustomInput
              type="select"
              control={form.control}
              name="coverage_type"
              label="Coverage"
              placeholder="Select coverage"
              selectList={[
                { label: "None", value: "NONE" },
                { label: "Insurance", value: "INSURANCE" },
                { label: "NHIA", value: "NHIA" },
                { label: "Waiver", value: "WAIVER" },
                { label: "Other", value: "OTHER" },
              ]}
            />

            <CustomInput
              type="input"
              control={form.control}
              name="coverage_reference"
              label="Coverage reference (Insurance/NHIA number)"
              placeholder=""
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="coverage_notes"
              label="Coverage notes"
              placeholder="Additional notes for cashier"
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="payment_reason"
              label="Payment reason"
              placeholder="Optional note about the payment"
            />

            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
