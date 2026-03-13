"use client";

import { dischargePatient } from "@/app/actions/ward";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const DischargeSchema = z.object({
  notes: z.string().optional(),
});

export function DischargePatient({ admissionId }: { admissionId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof DischargeSchema>>({
    resolver: zodResolver(DischargeSchema),
    defaultValues: { notes: "" },
  });

  const onSubmit = async (values: z.infer<typeof DischargeSchema>) => {
    try {
      setLoading(true);
      const res = await dischargePatient({ admission_id: admissionId, notes: values.notes || null });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to discharge patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-sm font-normal"><LogOut className="mr-2" size={16} /> Discharge</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discharge Patient</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="textarea" control={form.control} name="notes" label="Notes" placeholder="Optional discharge notes" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">{loading ? "Saving..." : "Save"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

