"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { CustomInput } from "@/components/custom-input";
import { toast } from "sonner";
import { createNewAppointment, getDoctorAvailableTimes } from "@/app/actions/appointment";
import { generateTimes } from "@/utils";

const ReceptionistBookingSchema = z.object({
  patient_id: z.string().min(1),
  doctor_id: z.string().min(1),
  appointment_date: z.string().min(1),
  time: z.string().min(1),
  type: z.string().min(1),
  note: z.string().optional(),
});

export function ReceptionistBookAppointment({
  patients,
  doctors,
  types = [
    { label: "General Consultation", value: "General Consultation" },
    { label: "General Check Up", value: "General Check Up" },
    { label: "Antenatal", value: "Antenatal" },
    { label: "Maternity", value: "Maternity" },
    { label: "Lab Test", value: "Lab Test" },
  ],
}: {
  patients: { label: string; value: string }[];
  doctors: { label: string; value: string }[];
  types?: { label: string; value: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [timeOptions, setTimeOptions] = useState(generateTimes(8, 17, 30));
  const form = useForm<z.infer<typeof ReceptionistBookingSchema>>({
    resolver: zodResolver(ReceptionistBookingSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      appointment_date: "",
      time: "",
      type: "",
      note: "",
    },
  });
  const watchDoctor = form.watch("doctor_id");
  const watchDate = form.watch("appointment_date");

  useEffect(() => {
    const loadTimes = async () => {
      if (!watchDoctor || !watchDate) {
        setTimeOptions(generateTimes(8, 17, 30));
        return;
      }
      try {
        const times = await getDoctorAvailableTimes(watchDoctor, watchDate);
        setTimeOptions(times && times.length > 0 ? times : []);
        form.setValue("time", "");
      } catch {
        setTimeOptions([]);
      }
    };
    loadTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchDoctor, watchDate]);

  

  const onSubmit = async (values: z.infer<typeof ReceptionistBookingSchema>) => {
    try {
      setLoading(true);
      const res = await createNewAppointment(values);
      if (res.success) {
        toast.success(res.message ?? "Appointment booked");
        form.reset({ patient_id: "", doctor_id: "", appointment_date: "", time: "", type: "", note: "" });
        router.refresh();
      } else {
        toast.error(res.msg ?? "Failed to book");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal bg-blue-600 text-white">Book Appointment</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CustomInput
              type="select"
              control={form.control}
              name="patient_id"
              label="Patient"
              placeholder="Select patient"
              selectList={[{ label: "Select patient", value: "" }, ...patients]}
            />
            <CustomInput
              type="select"
              control={form.control}
              name="doctor_id"
              label="Doctor"
              placeholder="Select doctor"
              selectList={[{ label: "Select doctor", value: "" }, ...doctors]}
            />
            <CustomInput
              type="select"
              control={form.control}
              name="type"
              label="Type"
              placeholder="Select type"
              selectList={[{ label: "Select type", value: "" }, ...types]}
            />
            <div className="flex items-center gap-2">
              <CustomInput type="input" control={form.control} name="appointment_date" label="Date" inputType="date" placeholder="" />
              <CustomInput type="select" control={form.control} name="time" label="Time" placeholder="Select time" selectList={timeOptions} />
            </div>
            <CustomInput type="textarea" control={form.control} name="note" label="Notes" placeholder="Optional notes" />
            <Button type="submit" disabled={loading} className="bg-blue-600 w-full">{loading ? "Saving..." : "Save"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
