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
  units,
}: {
  appointmentId: string;
  services: { label: string; value: string; unitId?: string }[];
  units: { label: string; value: string }[];
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState("");
  const [search, setSearch] = useState("");

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
            <div className="space-y-2">
              <label className="text-sm font-medium">Lab unit</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="">All units</option>
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search test</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <CustomInput
              type="select"
              control={form.control}
              name="service_id"
              label="Lab service"
              placeholder="Select lab service"
              selectList={services
                .filter((s) =>
                  selectedUnit ? s.unitId === selectedUnit : true
                )
                .filter((s) =>
                  search
                    ? s.label.toLowerCase().includes(search.toLowerCase())
                    : true
                )
                .map((s) => ({ label: s.label, value: s.value }))}
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
