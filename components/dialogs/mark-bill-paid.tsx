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
  { label: "HMO / Insurance", value: "INSURANCE" },
];

export const MarkBillPaid = ({
  patientBillId,
  defaultAmount,
}: {
  patientBillId: number;
  defaultAmount: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<{ label: string; value: string }[]>([]);
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

  const method = form.watch("payment_method");

  React.useEffect(() => {
    if (method === "INSURANCE") {
      fetch("/api/hmo-providers")
        .then((r) => r.json())
        .then((res) => {
          const list = Array.isArray(res?.data)
            ? res.data.map((p: any) => ({ label: p.name, value: String(p.name) }))
            : [];
          setProviders(list);
        })
        .catch(() => setProviders([]));
      form.setValue("coverage_type", "INSURANCE");
    } else {
      form.setValue("coverage_type", "NONE");
      form.setValue("coverage_reference", "");
      form.setValue("coverage_notes", "");
    }
  }, [method, form]);

  const handleSubmit = async (values: z.infer<typeof BillPaymentSchema>) => {
    try {
      setLoading(true);
      const res = await markPatientBillPaid(values);
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
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

            {method === "INSURANCE" && (
              <>
                <CustomInput
                  type="select"
                  control={form.control}
                  name="coverage_notes"
                  label="HMO / Insurance Provider"
                  placeholder="Select provider"
                  selectList={providers}
                />
                <CustomInput
                  type="input"
                  control={form.control}
                  name="coverage_reference"
                  label="Coverage reference"
                  placeholder="Policy/Member number"
                />
              </>
            )}

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
