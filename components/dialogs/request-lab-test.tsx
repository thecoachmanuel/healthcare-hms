"use client";

import { requestLabTest } from "@/app/actions/medical";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { LabTestRequestSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const RequestLabTest = ({
  appointmentId,
  services,
}: {
  appointmentId: string;
  services: { label: string; value: string }[];
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof LabTestRequestSchema>>({
    resolver: zodResolver(LabTestRequestSchema),
    defaultValues: {
      appointment_id: appointmentId,
      service_id: "",
      notes: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof LabTestRequestSchema>) => {
    try {
      setLoading(true);
      const res = await requestLabTest(values);
      if (res.success) {
        toast.success(res.message);
        form.reset({ appointment_id: appointmentId, service_id: "", notes: "" });
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to request lab test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-600 text-white">
          <Plus size={18} />
          Request Lab Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Lab Test</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <CustomInput
              type="select"
              control={form.control}
              name="service_id"
              label="Lab service"
              placeholder="Select lab service"
              selectList={services}
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="notes"
              label="Request notes"
              placeholder="Optional notes for the lab scientist"
            />

            <Button type="submit" disabled={loading} className="w-full bg-blue-600">
              {loading ? "Requesting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
