"use client";

import { DoctorSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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
import { CustomInput, SwitchInput } from "../custom-input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createNewDoctor } from "@/app/actions/admin";
import { Input } from "../ui/input";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

const TYPES = [
  { label: "Full-Time", value: "FULL" },
  { label: "Part-Time", value: "PART" },
];

const WORKING_DAYS = [
  { label: "Sunday", value: "sunday" },
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
];

type Day = {
  day: string;
  start_time?: string;
  close_time?: string;
};

export const DoctorForm = ({
  specializations,
  departments,
  wards,
}: {
  specializations: { label: string; value: string; department: string }[];
  departments: { label: string; value: string }[];
  wards: { label: string; value: string }[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [workSchedule, setWorkSchedule] = useState<Day[]>([]);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof DoctorSchema>>({
    resolver: zodResolver(DoctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      address: "",
      type: "FULL",
      department: "",
      ward_id: "",
      img: "",
      password: "",
      license_number: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof DoctorSchema>) => {
    try {
      if (workSchedule.length === 0) {
        toast.error("Please select work schedule");
        return;
      }

      setIsLoading(true);
      let img = values.img;
      if (profileFile) {
        img = await uploadToCloudinary(profileFile, "hms/doctors");
      }
      const resp = await createNewDoctor({
        ...values,
        img,
        work_schedule: workSchedule,
      });

      if (resp.success) {
        toast.success("Doctor added successfully!");

        setWorkSchedule([]);
        form.reset();
        setProfileFile(null);
        router.refresh();
      } else if (resp.error) {
        toast.error(resp.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSpecialization = form.watch("specialization");

  useEffect(() => {
    if (selectedSpecialization) {
      const department = specializations.find(
        (el) => el.value === selectedSpecialization
      );

      if (department) {
        form.setValue("department", department.department);
      }
    }
  }, [selectedSpecialization, specializations, form]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Plus size={20} />
          Add Doctor
        </Button>
      </SheetTrigger>

      <SheetContent className="rounded-xl rounded-r-xl md:h-[90%] md:top-[5%] md:right-[1%] w-full overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>Add New Doctor</SheetTitle>
        </SheetHeader>

        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8 mt-5 2xl:mt-10"
            >
              <CustomInput
                type="radio"
                selectList={TYPES}
                control={form.control}
                name="type"
                label="Type"
                placeholder=""
                defaultValue="FULL"
              />

              <CustomInput
                type="input"
                control={form.control}
                name="name"
                placeholder="Doctor's name"
                label="Full Name"
              />

              <div className="flex items-center gap-2">
                <CustomInput
                  type="select"
                  control={form.control}
                  name="specialization"
                  placeholder="Select specialization"
                  label="Specialization"
                  selectList={specializations}
                />
                <CustomInput
                  type="select"
                  control={form.control}
                  name="department"
                  placeholder="Select department"
                  label="Department"
                  selectList={[{ label: "Select department", value: "" }, ...departments]}
                />
              </div>

            <CustomInput
              type="select"
              control={form.control}
              name="ward_id"
              placeholder="Select ward (optional)"
              label="Ward Assignment"
              selectList={[{ label: "None", value: "" }, ...wards]}
            />

              <CustomInput
                type="input"
                control={form.control}
                name="license_number"
                placeholder="License Number"
                label="License Number"
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
                name="address"
                placeholder="1479 Street, Apt 1839-G, NY"
                label="Address"
              />

              <div className="space-y-2">
                <Label htmlFor="doctor-photo">Profile photo</Label>
                <Input
                  id="doctor-photo"
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

              <div className="mt-6">
                <Label>Working Days</Label>

                <SwitchInput
                  data={WORKING_DAYS}
                  setWorkSchedule={setWorkSchedule}
                />
              </div>

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
