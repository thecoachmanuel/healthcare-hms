"use client";

import { markPatientBillPaid } from "@/app/actions/medical";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { BillPaymentSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Card", value: "CARD" },
];

export const MarkBillPaid = ({
  patientBillId,
  defaultAmount,
}: {
  patientBillId: number;
  defaultAmount: number;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof BillPaymentSchema>>({
    resolver: zodResolver(BillPaymentSchema),
    defaultValues: {
      patient_bill_id: String(patientBillId),
      amount_paid: defaultAmount.toFixed(2),
      payment_method: "CASH",
      coverage_type: "NONE",
      coverage_notes: "",
      coverage_reference: "",
      payment_reason: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof BillPaymentSchema>) => {
    try {
      setLoading(true);
      const res = await markPatientBillPaid(values);
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Mark Paid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              label="Payment reason (if unpaid/partial)"
              placeholder="Reason for unpaid/partial payment"
            />

            <Button type="submit" disabled={loading} className="w-full bg-blue-600">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
