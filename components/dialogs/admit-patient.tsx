"use client";

import { admitPatient } from "@/app/actions/ward";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bed } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const AdmitSchema = z.object({
  ward_id: z.string().min(1),
  attending_doctor_id: z.string().optional(),
});

export function AdmitPatient({ patientId, wards, doctors }: { patientId: string; wards: { label: string; value: string }[]; doctors: { label: string; value: string }[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof AdmitSchema>>({
    resolver: zodResolver(AdmitSchema),
    defaultValues: { ward_id: "", attending_doctor_id: "" },
  });

  const onSubmit = async (values: z.infer<typeof AdmitSchema>) => {
    try {
      setLoading(true);
      const res = await admitPatient({ patient_id: patientId, ward_id: Number(values.ward_id), attending_doctor_id: values.attending_doctor_id || null });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to admit patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal"><Bed className="mr-2" size={16} /> Admit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="select" control={form.control} name="ward_id" label="Ward" placeholder="Select ward" selectList={[{ label: "Select ward", value: "" }, ...wards]} />
            <CustomInput type="select" control={form.control} name="attending_doctor_id" label="Attending Doctor" placeholder="Optional" selectList={[{ label: "None", value: "" }, ...doctors]} />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">{loading ? "Saving..." : "Save"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
