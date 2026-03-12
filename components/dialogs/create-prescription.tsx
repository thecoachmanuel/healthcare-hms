"use client";

import { createPrescription } from "@/app/actions/prescription";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { CreatePrescriptionSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const CreatePrescription = ({
  appointmentId,
  patientId,
  medications,
}: {
  appointmentId: string;
  patientId: string;
  medications: { label: string; value: string }[];
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof CreatePrescriptionSchema>>({
    resolver: zodResolver(CreatePrescriptionSchema),
    defaultValues: {
      appointment_id: appointmentId,
      patient_id: patientId,
      notes: "",
      items: [{ medication_id: "", quantity: "1", dosage: "", instructions: "" }],
    },
  });

  const handleSubmit = async (values: z.infer<typeof CreatePrescriptionSchema>) => {
    try {
      setLoading(true);
      const res = await createPrescription(values);
      if (res.success) {
        toast.success(res.msg);
        form.reset({
          appointment_id: appointmentId,
          patient_id: patientId,
          notes: "",
          items: [{ medication_id: "", quantity: "1", dosage: "", instructions: "" }],
        });
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={22} className="text-gray-400" />
          New Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <CustomInput
              type="select"
              control={form.control}
              name={"items.0.medication_id" as any}
              label="Medication"
              placeholder="Select medication"
              selectList={medications}
            />

            <CustomInput
              type="input"
              control={form.control}
              name={"items.0.quantity" as any}
              label="Quantity"
              placeholder="1"
            />

            <CustomInput
              type="input"
              control={form.control}
              name={"items.0.dosage" as any}
              label="Dosage"
              placeholder="e.g. 1 tablet twice daily"
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name={"items.0.instructions" as any}
              label="Instructions"
              placeholder="e.g. after meals"
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="notes"
              label="Notes"
              placeholder="Optional"
            />

            <Button type="submit" disabled={loading} className="w-full bg-blue-600">
              {loading ? "Saving..." : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
