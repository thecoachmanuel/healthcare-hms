"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { enqueueVisit } from "@/app/actions/queue";
import { useRouter } from "next/navigation";

export function AppointmentCheckInButton({ appointmentId, disabled }: { appointmentId: number; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onCheckIn = async () => {
    try {
      setLoading(true);
      const res = await enqueueVisit({ appointmentId, intakeType: "APPOINTMENT" });
      if ((res as any)?.success) {
        const qn = (res as any)?.queueNumber ? ` (Queue ${res.queueNumber})` : "";
        toast.success(`Checked in to queue${qn}`);
        router.refresh();
      } else {
        toast.error((res as any)?.msg ?? "Failed to check in");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" disabled={disabled || loading} onClick={onCheckIn}>
      {loading ? "Checking in…" : "Check-in to Queue"}
    </Button>
  );
}

