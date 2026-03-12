"use client";

import React, { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ConfirmDelete({
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item?",
  onConfirm,
}: {
  title?: string;
  description?: string;
  onConfirm: () => Promise<{ success: boolean; msg: string }>;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await onConfirm();
      if (res.success) toast.success(res.msg);
      else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center justify-center rounded-full text-red-500">
          <Trash2 size={16} className="text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-6">
          <DialogTitle>
            <span className="text-xl text-black">{title}</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">{description}</p>

          <div className="flex justify-center mt-6 items-center gap-x-3">
            <DialogClose asChild>
              <Button variant="outline" className="px-4 py-2">
                Cancel
              </Button>
            </DialogClose>

            <Button
              disabled={loading}
              variant="outline"
              className="px-4 py-2 text-sm font-medium bg-destructive text-white hover:bg-destructive hover:text-white"
              onClick={handleDelete}
            >
              {loading ? "Deleting..." : "Yes. Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

