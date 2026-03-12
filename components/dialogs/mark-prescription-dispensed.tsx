"use client";

import { markPrescriptionDispensed } from "@/app/actions/prescription";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export const MarkPrescriptionDispensed = ({ id }: { id: number }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    try {
      setLoading(true);
      const res = await markPrescriptionDispensed(String(id));
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={handleClick}>
      {loading ? "Saving..." : "Mark Dispensed"}
    </Button>
  );
};

