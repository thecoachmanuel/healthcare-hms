"use client";

import { adminUpdatePatient } from "@/app/actions/patient";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { GENDER, MARITAL_STATUS, RELATION } from "@/lib";
import { PatientUpdateSchema } from "@/lib/schema";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { Patient } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const EditPatientForm = ({ patient }: { patient: Patient }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof PatientUpdateSchema>>({
    resolver: zodResolver(PatientUpdateSchema),
    defaultValues: {
      first_name: patient.first_name ?? "",
      last_name: patient.last_name ?? "",
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      date_of_birth: new Date(patient.date_of_birth),
      gender: patient.gender,
      marital_status: patient.marital_status as any,
      emergency_contact_name: patient.emergency_contact_name ?? "",
      emergency_contact_number: patient.emergency_contact_number ?? "",
      relation: patient.relation as any,
      blood_group: patient.blood_group ?? "",
      allergies: patient.allergies ?? "",
      medical_conditions: patient.medical_conditions ?? "",
      medical_history: patient.medical_history ?? "",
      insurance_provider: patient.insurance_provider ?? "",
      insurance_number: patient.insurance_number ?? "",
      img: patient.img ?? "",
      privacy_consent: patient.privacy_consent,
      service_consent: patient.service_consent,
      medical_consent: patient.medical_consent,
    } as any,
  });

  const handleSubmit = async (values: z.infer<typeof PatientUpdateSchema>) => {
    try {
      setLoading(true);
      let img = values.img;
      if (profileFile) {
        img = await uploadToCloudinary(profileFile, "hms/patients");
      }

      const res = await adminUpdatePatient({ ...values, img }, patient.id);
      if (res.success) {
        toast.success(res.msg);
        router.push("/record/patients");
        router.refresh();
      } else {
        toast.error(res.msg);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-6">
        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="first_name" label="First name" placeholder="" />
          <CustomInput type="input" control={form.control} name="last_name" label="Last name" placeholder="" />
        </div>

        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="email" label="Email" placeholder="" />
          <CustomInput type="input" control={form.control} name="phone" label="Phone" placeholder="" />
        </div>

        <CustomInput type="input" control={form.control} name="address" label="Address" placeholder="" />

        <div className="flex items-center gap-2">
          <CustomInput
            type="select"
            control={form.control}
            name="gender"
            label="Gender"
            placeholder="Select gender"
            selectList={GENDER}
          />
          <CustomInput
            type="input"
            control={form.control}
            name="date_of_birth"
            label="Date of Birth"
            placeholder=""
            inputType="date"
          />
        </div>

        <CustomInput
          type="select"
          control={form.control}
          name="marital_status"
          label="Marital status"
          placeholder="Select status"
          selectList={MARITAL_STATUS}
        />

        <div className="flex items-center gap-2">
          <CustomInput
            type="input"
            control={form.control}
            name="emergency_contact_name"
            label="Emergency contact name"
            placeholder=""
          />
          <CustomInput
            type="input"
            control={form.control}
            name="emergency_contact_number"
            label="Emergency contact number"
            placeholder=""
          />
        </div>

        <CustomInput
          type="select"
          control={form.control}
          name="relation"
          label="Relation"
          placeholder="Select relation"
          selectList={RELATION}
        />

        <div className="flex items-center gap-2">
          <CustomInput type="input" control={form.control} name="blood_group" label="Blood group" placeholder="" />
          <CustomInput type="input" control={form.control} name="insurance_provider" label="Insurance provider" placeholder="" />
        </div>

        <CustomInput type="input" control={form.control} name="insurance_number" label="Insurance number" placeholder="" />

        <CustomInput type="textarea" control={form.control} name="medical_conditions" label="Medical conditions" placeholder="" />
        <CustomInput type="textarea" control={form.control} name="allergies" label="Allergies" placeholder="" />
        <CustomInput type="textarea" control={form.control} name="medical_history" label="Medical history" placeholder="" />

        <div className="space-y-2">
          <Label htmlFor="patient-photo-edit">Profile photo</Label>
          <Input id="patient-photo-edit" type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};

