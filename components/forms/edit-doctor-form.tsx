"use client";

import { updateDoctor } from "@/app/actions/admin";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { DoctorSchema } from "@/lib/schema";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { Doctor } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPECIALIZATION } from "@/utils/seetings";

const TYPES = [
  { label: "Full-Time", value: "FULL" },
  { label: "Part-Time", value: "PART" },
];

export const EditDoctorForm = ({ doctor }: { doctor: Doctor }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof DoctorSchema>>({
    resolver: zodResolver(DoctorSchema),
    defaultValues: {
      name: doctor.name ?? "",
      email: doctor.email ?? "",
      phone: doctor.phone ?? "",
      specialization: doctor.specialization ?? "",
      address: doctor.address ?? "",
      type: doctor.type as any,
      department: doctor.department ?? "",
      img: doctor.img ?? "",
      password: "",
      license_number: doctor.license_number ?? "",
    },
  });

  const selectedSpecialization = form.watch("specialization");
  useEffect(() => {
    if (selectedSpecialization) {
      const dept = SPECIALIZATION.find((el) => el.value === selectedSpecialization);
      if (dept) {
        form.setValue("department", dept.department);
      }
    }
  }, [selectedSpecialization]);

  const handleSubmit = async (values: z.infer<typeof DoctorSchema>) => {
    try {
      setLoading(true);
      let img = values.img;
      if (profileFile) {
        img = await uploadToCloudinary(profileFile, "hms/doctors");
      }
      const res = await updateDoctor({ ...values, img }, doctor.id);
      if (res.success) {
        toast.success(res.msg);
        router.push("/record/doctors");
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-6">
        <CustomInput
          type="radio"
          selectList={TYPES}
          control={form.control}
          name="type"
          label="Type"
          placeholder=""
          defaultValue={doctor.type}
        />

        <CustomInput type="input" control={form.control} name="name" label="Full Name" placeholder="" />

        <div className="flex items-center gap-2">
          <CustomInput
            type="select"
            control={form.control}
            name="specialization"
            placeholder="Select specialization"
            label="Specialization"
            selectList={SPECIALIZATION}
          />
          <CustomInput type="input" control={form.control} name="department" placeholder="" label="Department" />
        </div>

        <CustomInput type="input" control={form.control} name="license_number" placeholder="" label="License Number" />

        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="email" placeholder="" label="Email Address" />
          <CustomInput type="input" control={form.control} name="phone" placeholder="" label="Contact Number" />
        </div>

        <CustomInput type="input" control={form.control} name="address" placeholder="" label="Address" />

        <div className="space-y-2">
          <Label htmlFor="doctor-photo-edit">Profile photo</Label>
          <Input id="doctor-photo-edit" type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

