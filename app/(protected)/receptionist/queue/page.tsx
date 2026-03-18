"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientSearchSelect } from "@/components/patient-search-select";
import { enqueueVisit, skipTicket, markNoShow } from "@/app/actions/queue";
import { toast } from "sonner";

export default function ReceptionQueuePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [department, setDepartment] = useState("GEN");
  
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [appointmentId, setAppointmentId] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [currentTickets, setCurrentTickets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");
  

  const fetchQueue = useCallback(async () => {
    const res = await fetch(`/api/queue?department=${encodeURIComponent(department)}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }, [department]);

  const fetchCurrent = useCallback(async () => {
    const res = await fetch(`/api/queue/current?department=${encodeURIComponent(department)}`);
    const data = await res.json();
    setCurrentTickets(data.tickets ?? []);
  }, [department]);

  const priorityBadgeClass = (p: string | null | undefined) => {
    if (p === "RED") return "badge badge-high";
    if (p === "YELLOW") return "badge badge-medium";
    return "badge badge-low";
  };
  const priorityLabel = (p: string | null | undefined) => {
    if (p === 'RED') return 'HIGH';
    if (p === 'YELLOW') return 'MEDIUM';
    return 'LOW';
  };

  useEffect(() => {
    // Autofill department from current user if available
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const me = await res.json();
          if (me?.department) setDepartment(me.department);
        }
      } catch {}
    })();
    fetchQueue();
    fetchCurrent();
  }, [department, fetchQueue, fetchCurrent]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/appointments/today?department=${encodeURIComponent(department)}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.items ?? []);
      }
    })();
  }, [department]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/doctors?department=${encodeURIComponent(department)}`);
        if (res.ok) {
          const data = await res.json();
          setDoctorOptions(data.items ?? []);
        }
      } catch {
        setDoctorOptions([]);
      }
    })();
  }, [department]);

  useEffect(() => {
    if (!doctorId) return;
    const d = doctorOptions.find((x) => String(x.id) === String(doctorId));
    const docDept = (d?.department ?? "").trim();
    if (docDept.length > 0 && docDept !== department) setDepartment(docDept);
  }, [doctorId, doctorOptions, department]);

  

  useEffect(() => {
    const channel = supabase
      .channel("queue-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => {
        fetchQueue();
        fetchCurrent();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchQueue, fetchCurrent]);

  async function onEnqueue() {
    if (!selectedPatient?.id) return;
    try {
      await enqueueVisit({ patientId: selectedPatient.id, department, doctorId: doctorId || undefined, intakeType: "WALK_IN" });
      setSelectedPatient(null);
      await fetchQueue();
      toast.success("Patient checked in");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in");
    }
  }

  async function onCheckInAppointment() {
    if (!appointmentId) return;
    try {
      const id = Number(appointmentId);
      await enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setAppointmentId("");
      await fetchQueue();
      toast.success("Appointment checked in");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in appointment");
    }
  }

  async function onCheckInAppointmentFromList(id: number) {
    try {
      await enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      await fetchQueue();
      toast.success("Appointment checked in");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in appointment");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium">Department</label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="GEN" />
        </div>
        <div className="flex-[2]">
          <label className="text-sm font-medium">Patient</label>
          <PatientSearchSelect onSelect={(p) => { setSelectedPatient(p); }} />
          {selectedPatient ? (
            <div className="mt-1 text-xs text-gray-600">
              {selectedPatient.hospital_number ? `HN ${selectedPatient.hospital_number}` : null}
              {selectedPatient.phone ? ` ${selectedPatient.phone}` : null}
            </div>
          ) : null}
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Assign Doctor (optional)</label>
          <Select value={doctorId} onValueChange={(val) => setDoctorId(val === "any" ? "" : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Any doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any doctor</SelectItem>
              {doctorOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onEnqueue} disabled={!selectedPatient?.id}>Enqueue Walk-in</Button>
      </div>

      {/* Removed Appointment ID input in favor of searchable appointment list below */}

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">In Consultation</div>
        <div className="divide-y">
          {currentTickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">{t.queue_number}</span>
                <span className={priorityBadgeClass(t.priority)}>{t.priority === 'RED' ? 'HIGH' : t.priority === 'YELLOW' ? 'MEDIUM' : 'LOW'}</span>
                <span className="text-xs text-gray-500">Started {t.started_at ? new Date(t.started_at).toLocaleTimeString() : ""}</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
                {t.doctor_name ? <span className="text-xs text-gray-500">Dr. {t.doctor_name}</span> : null}
              </div>
            </div>
          ))}
          {currentTickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No patients currently in consultation</div>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className={priorityBadgeClass(t.priority)}>{priorityLabel(t.priority)}</span>
                <span className="text-xs text-gray-500">{new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
                {t.doctor_name ? <span className="text-xs text-gray-500">Dr. {t.doctor_name}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={async () => { await skipTicket(t.id); await fetchQueue(); }}>Skip</Button>
                <Button variant="destructive" onClick={async () => { await markNoShow(t.id); await fetchQueue(); }}>No-show</Button>
                <Link className="text-blue-600 text-sm" href={`/patient/queue/${t.visit_id}`}>Track</Link>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No waiting patients</div>
          )}
        </div>
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Today's Appointments</div>
        <div className="p-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-sm font-medium">Search</label>
              <Input value={apptQuery} onChange={(e) => setApptQuery(e.target.value)} placeholder="Search by time or type" />
            </div>
          </div>
          <div className="divide-y">
            {appointments
              .filter((a) => {
                const t = `${a.time ?? ""} ${a.type ?? ""} ${(a.patient?.first_name ?? "")} ${(a.patient?.last_name ?? "")} ${(a.doctor?.name ?? "")}`.toLowerCase();
                return apptQuery.trim() ? t.includes(apptQuery.toLowerCase()) : true;
              })
              .map((a) => (
              <div key={a.id} className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">#{a.id}</span>
                  <span className="text-sm">{a.type}</span>
                  <span className="text-sm text-gray-700">{a.patient?.first_name} {a.patient?.last_name}</span>
                  {a.doctor?.name ? <span className="text-xs text-gray-500">Dr. {a.doctor.name}</span> : null}
                  <span className="text-xs text-gray-600">{new Date(a.appointment_date).toISOString().slice(0,10)} {a.time}</span>
                  {a.window_start && a.window_end && (
                    <span className="text-xs text-gray-500">[{new Date(a.window_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(a.window_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                  )}
                </div>
                <div>
                  <Button size="sm" onClick={async () => { await onCheckInAppointmentFromList(a.id); }}>Check-in</Button>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="px-2 py-4 text-sm text-gray-500">No appointments for today</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
