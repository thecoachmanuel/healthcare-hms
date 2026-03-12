"use client";

import { updateLabTestResult } from "@/app/actions/medical";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { LabTestUpdateSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const STATUS_OPTIONS = [
  { label: "Requested", value: "REQUESTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

export const UpdateLabTest = ({
  id,
  currentStatus,
  currentResult,
  currentNotes,
}: {
  id: number;
  currentStatus?: string | null;
  currentResult?: string | null;
  currentNotes?: string | null;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof LabTestUpdateSchema>>({
    resolver: zodResolver(LabTestUpdateSchema),
    defaultValues: {
      id: String(id),
      status: currentStatus ?? "REQUESTED",
      result: currentResult ?? "",
      notes: currentNotes ?? "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof LabTestUpdateSchema>) => {
    try {
      setLoading(true);
      const res = await updateLabTestResult(values);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update lab test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%] 2xl:max-w-[40%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Lab Result</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <CustomInput
              type="select"
              control={form.control}
              name="status"
              label="Status"
              placeholder="Select status"
              selectList={STATUS_OPTIONS}
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="result"
              label="Result"
              placeholder="Enter test result"
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="notes"
              label="Notes"
              placeholder="Optional"
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
