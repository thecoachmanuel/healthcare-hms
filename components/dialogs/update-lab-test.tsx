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
  { label: "Sample Collected", value: "SAMPLE_COLLECTED" },
  { label: "Received in Lab", value: "RECEIVED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const UpdateLabTest = ({
  id,
  currentStatus,
  currentResult,
  currentNotes,
  currentSampleId,
  canApprove = false,
}: {
  id: number;
  currentStatus?: string | null;
  currentResult?: string | null;
  currentNotes?: string | null;
  currentSampleId?: string | null;
  canApprove?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [sampleId, setSampleId] = useState(currentSampleId ?? "");

  const form = useForm<z.infer<typeof LabTestUpdateSchema>>({
    resolver: zodResolver(LabTestUpdateSchema),
    defaultValues: {
      id: String(id),
      status: (currentStatus ?? "REQUESTED") as z.infer<typeof LabTestUpdateSchema>["status"],
      result: currentResult ?? "",
      notes: currentNotes ?? "",
    },
  });
  const status = form.watch("status");
  const resultVal = form.watch("result");

  const handleSubmit = async (values: z.infer<typeof LabTestUpdateSchema>) => {
    try {
      setLoading(true);
      const res = await updateLabTestResult({ ...values, sample_id: sampleId });
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
            <div>
              <label className="text-sm">Sample ID</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="e.g. LAB-2026-000123"
              />
            </div>
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

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading} className="bg-blue-600">
                {loading ? "Saving..." : "Save"}
              </Button>
              {canApprove && status === "COMPLETED" && (
                <ApproveLabTestButton
                  id={id}
                  currentResult={resultVal}
                  currentSampleId={sampleId}
                  onApproved={() => {
                    try {
                      form.setValue("status", "APPROVED");
                    } catch {}
                  }}
                />
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const ApproveLabTestButton = ({
  id,
  currentResult,
  currentSampleId,
  onApproved,
}: {
  id: number;
  currentResult?: string | null;
  currentSampleId?: string | null;
  onApproved?: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    if (!currentResult || currentResult.trim().length === 0 || currentResult.trim() === "PENDING") {
      toast.error("Enter the test result before approval");
      return;
    }
    if (!confirm("Approve this lab result? This will lock edits to scientists only.")) return;
    try {
      setLoading(true);
      const res = await updateLabTestResult({ id: String(id), status: "APPROVED", result: currentResult, sample_id: currentSampleId ?? undefined });
      if (res.success) {
        toast.success("Result approved");
        try {
          onApproved?.();
        } catch {}
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve result");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" className="bg-emerald-600" onClick={handleApprove} disabled={loading}>
      {loading ? "Approving..." : "Approve"}
    </Button>
  );
};
