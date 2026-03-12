"use client";

import { StaffSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Form } from "../ui/form";
import { CustomInput } from "../custom-input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createNewStaff } from "@/app/actions/admin";
import { Input } from "../ui/input";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

const TYPES = [
  { label: "Admin", value: "ADMIN" },
  { label: "Nurse", value: "NURSE" },
  { label: "Lab Scientist", value: "LAB_SCIENTIST" },
  { label: "Lab Technician", value: "LAB_TECHNICIAN" },
  { label: "Cashier", value: "CASHIER" },
  { label: "Pharmacist", value: "PHARMACIST" },
  { label: "Record Officer", value: "RECORD_OFFICER" },
];

export const StaffForm = ({
  labUnits,
  departments,
}: {
  labUnits: { label: string; value: string }[];
  departments: { label: string; value: string }[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof StaffSchema>>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "NURSE",
      lab_unit_id: "",
      address: "",
      department: "",
      img: "",
      password: "",
      license_number: "",
    },
  });
  const role = form.watch("role");

  const handleSubmit = async (values: z.infer<typeof StaffSchema>) => {
    try {
      setIsLoading(true);
      let img = values.img;
      if (profileFile) {
        img = await uploadToCloudinary(profileFile, "hms/staff");
      }
      const resp = await createNewStaff({ ...values, img });

      if (resp.success) {
        toast.success("Staff added successfully!");

        form.reset();
        setProfileFile(null);
        router.refresh();
      } else {
        toast.error(resp.msg ?? "Failed to add staff");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Plus size={20} />
          New Staff
        </Button>
      </SheetTrigger>

      <SheetContent className="rounded-xl rounded-r-xl md:h-[90%] md:top-[5%] md:right-[1%] w-full overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>Add New Staff</SheetTitle>
        </SheetHeader>

        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8 mt-5 2xl:mt-10"
            >
              <CustomInput
                type="select"
                selectList={TYPES}
                control={form.control}
                name="role"
                label="Type"
                placeholder="Select role"
              />

              {(role === "LAB_SCIENTIST" || role === "LAB_TECHNICIAN") && (
                <CustomInput
                  type="select"
                  selectList={labUnits}
                  control={form.control}
                  name="lab_unit_id"
                  label="Lab Unit"
                  placeholder="Select unit"
                />
              )}

              <CustomInput
                type="input"
                control={form.control}
                name="name"
                placeholder="Staff name"
                label="Full Name"
              />

              <div className="flex items-center gap-2">
                <CustomInput
                  type="input"
                  control={form.control}
                  name="email"
                  placeholder="john@example.com"
                  label="Email Address"
                />

                <CustomInput
                  type="input"
                  control={form.control}
                  name="phone"
                  placeholder="9225600735"
                  label="Contact Number"
                />
              </div>

              <CustomInput
                type="input"
                control={form.control}
                name="license_number"
                placeholder="License Number"
                label="License Number"
              />
              <CustomInput
                type="select"
                control={form.control}
                name="department"
                placeholder="Children's ward"
                label="Department"
                selectList={[{ label: "Select department", value: "" }, ...departments]}
              />

              <CustomInput
                type="input"
                control={form.control}
                name="address"
                placeholder="1479 Street, Apt 1839-G, NY"
                label="Address"
              />

              <div className="space-y-2">
                <Label htmlFor="staff-photo">Profile photo</Label>
                <Input
                  id="staff-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <CustomInput
                type="input"
                control={form.control}
                name="password"
                placeholder=""
                label="Password"
                inputType="password"
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
