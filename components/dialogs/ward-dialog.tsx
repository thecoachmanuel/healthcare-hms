"use client";

import { createWard, updateWard } from "@/app/actions/ward";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const WardSchema = z.object({
  name: z.string().min(2),
  department: z.string().optional(),
  capacity: z.coerce.number().int().nonnegative().default(0),
  active: z.boolean().optional(),
});

export function AddWard({ departments }: { departments: { label: string; value: string }[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof WardSchema>>({
    resolver: zodResolver(WardSchema),
    defaultValues: { name: "", department: "", capacity: 0 },
  });

  const onSubmit = async (values: z.infer<typeof WardSchema>) => {
    try {
      setLoading(true);
      const res = await createWard({ name: values.name, department: values.department || null, capacity: values.capacity });
      if (res.success) {
        toast.success(res.msg);
        form.reset({ name: "", department: "", capacity: 0 });
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create ward");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={18} className="text-gray-500" /> Add Ward
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Ward</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="name" label="Ward name" placeholder="" />
            <CustomInput type="select" control={form.control} name="department" label="Department" placeholder="Select department" selectList={[{ label: "None", value: "" }, ...departments]} />
            <CustomInput type="input" control={form.control} name="capacity" label="Capacity" placeholder="e.g. 20" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">{loading ? "Saving..." : "Save"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EditWard({ id, name, department, capacity, active, departments }: { id: number; name: string; department?: string | null; capacity?: number | null; active: boolean; departments: { label: string; value: string }[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof WardSchema>>({
    resolver: zodResolver(WardSchema),
    defaultValues: { name, department: department ?? "", capacity: capacity ?? 0, active },
  });

  const onSubmit = async (values: z.infer<typeof WardSchema>) => {
    try {
      setLoading(true);
      const res = await updateWard({ id, name: values.name, department: values.department || null, capacity: values.capacity, active: values.active ?? true });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update ward");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil size={16} className="text-gray-500" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ward</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="name" label="Ward name" placeholder="" />
            <CustomInput type="select" control={form.control} name="department" label="Department" placeholder="Select department" selectList={[{ label: "None", value: "" }, ...departments]} />
            <CustomInput type="input" control={form.control} name="capacity" label="Capacity" placeholder="e.g. 20" />
            <CustomInput type="checkbox" control={form.control} name="active" label="Active" placeholder="Active" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">{loading ? "Saving..." : "Save"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

