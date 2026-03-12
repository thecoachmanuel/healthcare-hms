"use client";

import { createDepartment, updateDepartment } from "@/app/actions/catalog";
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

const DepartmentSchema = z.object({
  name: z.string().min(2),
  active: z.boolean().optional(),
});

export function AddDepartment() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: z.infer<typeof DepartmentSchema>) => {
    try {
      setLoading(true);
      const res = await createDepartment({ name: values.name });
      if (res.success) {
        toast.success(res.msg);
        form.reset({ name: "" });
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={18} className="text-gray-500" /> Add Department
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="name" label="Department name" placeholder="" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function EditDepartment({ id, name, active }: { id: number; name: string; active: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: { name, active },
  });

  const onSubmit = async (values: z.infer<typeof DepartmentSchema>) => {
    try {
      setLoading(true);
      const res = await updateDepartment({ id, name: values.name, active: values.active ?? true });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil size={16} className="text-gray-500" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="name" label="Department name" placeholder="" />
            <CustomInput type="checkbox" control={form.control} name="active" label="Active" placeholder="Active" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

