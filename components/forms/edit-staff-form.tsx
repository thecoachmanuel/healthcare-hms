"use client";

import { updateStaff } from "@/app/actions/admin";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { StaffSchema } from "@/lib/schema";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { Staff } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPES = [
  { label: "Nurse", value: "NURSE" },
  { label: "Lab Scientist", value: "LAB_SCIENTIST" },
  { label: "Lab Technician", value: "LAB_TECHNICIAN" },
  { label: "Cashier", value: "CASHIER" },
  { label: "Pharmacist", value: "PHARMACIST" },
];

export const EditStaffForm = ({ staff }: { staff: Staff }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof StaffSchema>>({
    resolver: zodResolver(StaffSchema),
    defaultValues: {
      name: staff.name ?? "",
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      role: staff.role as any,
      address: staff.address ?? "",
      department: staff.department ?? "",
      img: staff.img ?? "",
      password: "",
      license_number: staff.license_number ?? "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof StaffSchema>) => {
    try {
      setLoading(true);
      let img = values.img;
      if (profileFile) {
        img = await uploadToCloudinary(profileFile, "hms/staff");
      }

      const res = await updateStaff({ ...values, img }, staff.id);
      if (res.success) {
        toast.success(res.msg);
        router.push("/record/staffs");
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-6">
        <CustomInput type="input" control={form.control} name="name" label="Full Name" placeholder="" />
        <CustomInput type="select" control={form.control} name="role" label="Role" placeholder="Select role" selectList={TYPES} />
        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="email" label="Email" placeholder="" />
          <CustomInput type="input" control={form.control} name="phone" label="Phone" placeholder="" />
        </div>
        <CustomInput type="input" control={form.control} name="address" label="Address" placeholder="" />
        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="department" label="Department" placeholder="" />
          <CustomInput type="input" control={form.control} name="license_number" label="License Number" placeholder="" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-photo">Profile photo</Label>
          <Input id="staff-photo" type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-blue-600">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

