"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { addNewService } from "@/app/actions/admin";

import { z } from "zod";

import { Button } from "../ui/button";
import { CardDescription, CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { ServicesSchema } from "@/lib/schema";
import { CustomInput } from "../custom-input";

export const AddService = ({
  category = "GENERAL",
  buttonText = "Add New Service",
  title,
  description,
  labUnits = [],
}: {
  category?: "GENERAL" | "LAB_TEST" | "MEDICATION";
  buttonText?: string;
  title?: string;
  description?: string;
  labUnits?: { label: string; value: string }[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof ServicesSchema>>({
    resolver: zodResolver(ServicesSchema),
    defaultValues: {
      service_name: undefined,
      price: undefined,
      description: undefined,
      category,
      lab_unit_id: "",
    },
  });

  const handleOnSubmit = async (values: z.infer<typeof ServicesSchema>) => {
    try {
      setIsLoading(true);
      const resp = await addNewService({
        ...values,
        category,
      });

      if (resp.success) {
        toast.success(resp.msg ?? "Saved");

        router.refresh();

        form.reset({ category, lab_unit_id: "" } as any);
      } else {
        toast.error(resp.msg ?? "Failed to save");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="text-sm font-normal">
            <Plus size={22} className="text-gray-500" /> {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <CardHeader className="px-0">
            <DialogTitle>{title ?? "Add New Service"}</DialogTitle>
            <CardDescription>{description ?? "Create a new item in the catalog."}</CardDescription>
          </CardHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-8"
            >
              <CustomInput
                type="input"
                control={form.control}
                name="service_name"
                label="Name"
                placeholder=""
              />

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

              <CustomInput
                type="input"
                control={form.control}
                name="price"
                placeholder=""
                label="Price"
              />
              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="description"
                  placeholder=""
                  label="Description"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 w-full"
              >
                Submit
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
