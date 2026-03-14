"use client";

import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SwitchInput } from "@/components/custom-input";
import { toast } from "sonner";
import { updateMyWorkingDays } from "@/app/actions/doctor";

const DAYS = [
  { label: "Sunday", value: "sunday" },
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
];

type Day = { day: string; start_time?: string; close_time?: string };

export function DoctorAvailabilityForm({ schedule }: { schedule: Day[] }) {
  const [loading, setLoading] = useState(false);
  const [workSchedule, setWorkSchedule] = useState<Day[]>(schedule ?? []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await updateMyWorkingDays(workSchedule);
      if (res.success) {
        toast.success(res.msg ?? "Availability updated");
      } else {
        toast.error(res.msg ?? "Failed to update availability");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-md p-4">
      <div className="font-medium mb-2">My Availability</div>
      <Form>
        <div className="mt-2">
          <SwitchInput data={DAYS} setWorkSchedule={setWorkSchedule} schedule={schedule} />
        </div>
        <div className="mt-4">
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600">
            {loading ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </Form>
    </div>
  );
}

