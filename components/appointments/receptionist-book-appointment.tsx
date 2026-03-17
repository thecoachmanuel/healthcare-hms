"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { CustomInput } from "@/components/custom-input";
import { toast } from "sonner";
import { createNewAppointment, getDoctorAvailableTimes } from "@/app/actions/appointment";
import { generateTimes } from "@/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<{ id: string; first_name: string; last_name: string; hospital_number?: string; phone?: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; first_name: string; last_name: string } | null>(null);
  const [patientActiveIndex, setPatientActiveIndex] = useState(-1);
  const [doctorQuery, setDoctorQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);

  const doFilterDoctors = (q: string) => {
    const t = q.trim().toLowerCase();
    setFilteredDoctors(!t ? doctors : doctors.filter((d) => d.label.toLowerCase().includes(t)));
  };

  useEffect(() => {
    const q = patientQuery.trim();
    if (!q || q.length < 2) {
      setPatientResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`,{ signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          setPatientResults(data.items ?? []);
        }
      } catch {
        setPatientResults([]);
      }
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [patientQuery]);

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
            <FormField
              control={form.control}
              name="patient_id"
              render={() => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <div>
                    <Input
                      value={selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : patientQuery}
                      onChange={(e) => {
                        setSelectedPatient(null);
                        setPatientQuery(e.target.value);
                        setPatientActiveIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        if (!patientResults.length) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setPatientActiveIndex((prev) => (prev + 1) % patientResults.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setPatientActiveIndex((prev) => (prev <= 0 ? patientResults.length - 1 : prev - 1));
                        } else if (e.key === 'Enter') {
                          if (patientActiveIndex >= 0) {
                            const p = patientResults[patientActiveIndex];
                            setSelectedPatient(p);
                            setPatientResults([]);
                            setPatientQuery("");
                            form.setValue('patient_id', p.id);
                          }
                        } else if (e.key === 'Escape') {
                          setPatientResults([]);
                          setPatientActiveIndex(-1);
                        }
                      }}
                      placeholder="Search name, hospital number, phone"
                    />
                    {!selectedPatient && patientResults.length > 0 ? (
                      <div className="mt-2 border rounded-md bg-white overflow-hidden" role="listbox">
                        {patientResults.map((p, idx) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${idx === patientActiveIndex ? 'bg-blue-100' : ''}`}
                            onMouseEnter={() => setPatientActiveIndex(idx)}
                            onMouseLeave={() => setPatientActiveIndex(-1)}
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientResults([]);
                              setPatientQuery("");
                              setPatientActiveIndex(-1);
                              form.setValue('patient_id', p.id);
                            }}
                            role="option"
                            aria-selected={idx === patientActiveIndex}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{p.first_name} {p.last_name}</span>
                              <span className="text-xs text-gray-500">{p.hospital_number ? `HN ${p.hospital_number}` : p.phone}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Replaced static select with searchable select below */}
            <FormField
              control={form.control}
              name="doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); }} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input value={doctorQuery} onChange={(e) => { setDoctorQuery(e.target.value); doFilterDoctors(e.target.value); }} placeholder="Type to search..." className="h-8" />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredDoctors.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
