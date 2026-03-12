"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { addNewService } from "@/app/actions/admin";
import { ServicesSchema } from "@/lib/schema";
import { Button } from "../ui/button";
import { CardDescription, CardHeader } from "../ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Form } from "../ui/form";
import { CustomInput } from "../custom-input";

export const AddMedication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof ServicesSchema>>({
    resolver: zodResolver(ServicesSchema),
    defaultValues: {
      service_name: undefined,
      price: undefined,
      description: undefined,
      category: "MEDICATION",
    },
  });

  const handleOnSubmit = async (values: z.infer<typeof ServicesSchema>) => {
    try {
      setIsLoading(true);
      const resp = await addNewService({ ...values, category: "MEDICATION" });
      if (resp.success) {
        toast.success("Medication added successfully!");
        router.refresh();
        form.reset({ category: "MEDICATION" } as any);
      } else {
        toast.error(resp.msg);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={22} className="text-gray-500" /> Add Medication
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CardHeader className="px-0">
          <DialogTitle>Add Medication</DialogTitle>
          <CardDescription>Create a global medication with a price.</CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleOnSubmit)} className="space-y-8">
            <CustomInput
              type="input"
              control={form.control}
              name="service_name"
              label="Medication Name"
              placeholder=""
            />

            <CustomInput
              type="input"
              control={form.control}
              name="price"
              placeholder=""
              label="Price"
            />

            <CustomInput
              type="textarea"
              control={form.control}
              name="description"
              placeholder=""
              label="Description"
            />

            <Button type="submit" disabled={isLoading} className="bg-blue-600 w-full">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

