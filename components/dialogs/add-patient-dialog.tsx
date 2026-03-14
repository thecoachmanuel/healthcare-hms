"use client";

import { createNewPatient } from "@/app/actions/patient";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GENDER, MARITAL_STATUS, RELATION } from "@/lib";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { PatientFormSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [providerOptions, setProviderOptions] = useState<{ label: string; value: string }[]>([]);
  const [manualProvider, setManualProvider] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof PatientFormSchema>>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: new Date(),
      gender: "MALE",
      phone: "",
      email: "",
      address: "",
      marital_status: "single",
      emergency_contact_name: "",
      emergency_contact_number: "",
      relation: "mother",
      blood_group: "",
      allergies: "",
      medical_conditions: "",
      medical_history: "",
      insurance_provider: "",
      insurance_number: "",
      hospital_number: "",
      privacy_consent: true,
      service_consent: true,
      medical_consent: true,
      img: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof PatientFormSchema>) => {
    try {
      setLoading(true);
      if (values.insurance_provider === "_OTHER" && manualProvider.trim()) {
        values.insurance_provider = manualProvider.trim();
      }

      let img = values.img;
      if (profileFile) {
        try {
          img = await uploadToCloudinary(profileFile, "hms/patients");
        } catch (e: any) {
          toast.error(e?.message ?? "Image upload failed");
          setLoading(false);
          return;
        }
      }

      const res = await createNewPatient({ ...values, img }, "new-patient");

      if (res?.success) {
        toast.success(res.msg);
        form.reset();
        setProfileFile(null);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res?.msg ?? "Failed to create patient");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create patient");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetch("/api/hmo-providers")
      .then((r) => r.json())
      .then((j) => {
        const options: { label: string; value: string }[] = Array.isArray(j?.data)
          ? j.data.map((p: any) => ({ label: p.name, value: p.name }))
          : [];
        setProviderOptions([...options, { label: "Other (type manually)", value: "_OTHER" }]);
      })
      .catch(() => setProviderOptions([{ label: "Other (type manually)", value: "_OTHER" }]));
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={18} className="text-gray-500" /> Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Patient</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient-photo">Profile photo</Label>
              <Input
                id="patient-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput type="input" control={form.control} name="first_name" placeholder="John" label="First Name" />
              <CustomInput type="input" control={form.control} name="last_name" placeholder="Doe" label="Last Name" />
            </div>

            <CustomInput type="input" control={form.control} name="email" placeholder="john@example.com" label="Email Address" />

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput
                type="select"
                control={form.control}
                name="gender"
                placeholder="Select gender"
                label="Gender"
                selectList={GENDER!}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="date_of_birth"
                placeholder=""
                label="Date of Birth"
                inputType="date"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput type="input" control={form.control} name="phone" placeholder="9225600735" label="Contact Number" />
              <CustomInput
                type="select"
                control={form.control}
                name="marital_status"
                placeholder="Select"
                label="Marital Status"
                selectList={MARITAL_STATUS!}
              />
            </div>

            <CustomInput type="textarea" control={form.control} name="address" placeholder="" label="Address" />

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput
                type="input"
                control={form.control}
                name="emergency_contact_name"
                placeholder=""
                label="Emergency Contact Name"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="emergency_contact_number"
                placeholder=""
                label="Emergency Contact Number"
              />
            </div>

            <CustomInput
              type="select"
              control={form.control}
              name="relation"
              placeholder="Relation"
              label="Relation"
              selectList={RELATION!}
            />

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput type="input" control={form.control} name="blood_group" placeholder="" label="Blood Group" />
              <CustomInput type="input" control={form.control} name="hospital_number" placeholder="" label="Hospital Number" />
            </div>

            <CustomInput type="textarea" control={form.control} name="allergies" placeholder="" label="Allergies" />
            <CustomInput type="textarea" control={form.control} name="medical_conditions" placeholder="" label="Medical Conditions" />
            <CustomInput type="textarea" control={form.control} name="medical_history" placeholder="" label="Medical History" />

            <div className="flex flex-col lg:flex-row gap-y-6 items-center gap-2 md:gap-x-4">
              <CustomInput type="select" control={form.control} name="insurance_provider" placeholder="Select provider" label="Insurance Provider" selectList={providerOptions} />
              <CustomInput type="input" control={form.control} name="insurance_number" placeholder="" label="Insurance Number" />
            </div>
            {form.watch("insurance_provider") === "_OTHER" && (
              <div>
                <Label>Custom provider</Label>
                <Input value={manualProvider} onChange={(e) => setManualProvider(e.target.value)} placeholder="Enter provider name" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <CustomInput type="checkbox" control={form.control} name="privacy_consent" label="Privacy consent" placeholder="" />
              <CustomInput type="checkbox" control={form.control} name="service_consent" label="Service consent" placeholder="" />
              <CustomInput type="checkbox" control={form.control} name="medical_consent" label="Medical consent" placeholder="" />
            </div>

            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
