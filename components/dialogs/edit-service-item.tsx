"use client";

import { updateServiceCatalogItem } from "@/app/actions/catalog";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const EditSchema = z.object({
  service_name: z.string().min(2),
  price: z.string().min(1),
  description: z.string().min(1),
  lab_unit_id: z.string().optional(),
});

export function EditServiceItem({
  id,
  category,
  service_name,
  price,
  description,
  lab_unit_id,
  labUnits,
}: {
  id: number;
  category: "GENERAL" | "LAB_TEST" | "MEDICATION";
  service_name: string;
  price: number;
  description: string;
  lab_unit_id?: number | null;
  labUnits: { label: string; value: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof EditSchema>>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      service_name,
      price: String(price),
      description,
      lab_unit_id: lab_unit_id ? String(lab_unit_id) : "",
    },
  });

  const onSubmit = async (values: z.infer<typeof EditSchema>) => {
    try {
      setLoading(true);
      const res = await updateServiceCatalogItem({
        id,
        category,
        service_name: values.service_name,
        price: Number(values.price),
        description: values.description,
        lab_unit_id: category === "LAB_TEST" ? Number(values.lab_unit_id || 0) : null,
      });
      if (res.success) {
        toast.success(res.msg);
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
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
          <DialogTitle>Edit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput type="input" control={form.control} name="service_name" label="Name" placeholder="" />
            {category === "LAB_TEST" && (
              <CustomInput
                type="select"
                control={form.control}
                name="lab_unit_id"
                label="Lab Unit"
                placeholder="Select unit"
                selectList={[{ label: "Select unit", value: "" }, ...labUnits]}
              />
            )}
            <CustomInput type="input" control={form.control} name="price" label="Price" placeholder="" />
            <CustomInput type="textarea" control={form.control} name="description" label="Description" placeholder="" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

