"use client";

import { recordMedicationAdministration } from "@/app/actions/prescription";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { MedicationAdministrationSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export function RecordMedicationAdministration({
  prescriptionItemId,
  patientId,
  medicationName,
  remaining,
}: {
  prescriptionItemId: number;
  patientId: string;
  medicationName: string;
  remaining: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof MedicationAdministrationSchema>>({
    resolver: zodResolver(MedicationAdministrationSchema),
    defaultValues: {
      prescription_item_id: String(prescriptionItemId),
      patient_id: patientId,
      quantity: "1",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof MedicationAdministrationSchema>) => {
    try {
      const qty = Number(values.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }
      if (qty > remaining) {
        toast.error(`Quantity exceeds remaining (${remaining})`);
        return;
      }

      setLoading(true);
      const res = await recordMedicationAdministration(values);
      if (res.success) {
        toast.success(res.msg);
        form.reset({
          prescription_item_id: String(prescriptionItemId),
          patient_id: patientId,
          quantity: "1",
          notes: "",
        });
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to record administration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Administer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administer Medication</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-gray-600">
          <div className="font-medium">{medicationName}</div>
          <div>Remaining: {remaining}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="quantity" label="Quantity" placeholder="1" />
            <CustomInput type="textarea" control={form.control} name="notes" label="Notes" placeholder="Optional" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

