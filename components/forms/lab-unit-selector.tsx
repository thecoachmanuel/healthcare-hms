"use client";

import { updateMyLabUnit } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export function LabUnitSelector({
  units,
  currentUnitId,
}: {
  units: { label: string; value: string }[];
  currentUnitId: string;
}) {
  const [unitId, setUnitId] = useState(currentUnitId);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Lab unit</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value="">Select unit</option>
          {units.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        className="bg-blue-600"
        disabled={loading || !unitId}
        onClick={async () => {
          try {
            setLoading(true);
            const res = await updateMyLabUnit(Number(unitId));
            if (res.success) {
              toast.success(res.msg);
              router.refresh();
            } else toast.error(res.msg);
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to update unit");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

