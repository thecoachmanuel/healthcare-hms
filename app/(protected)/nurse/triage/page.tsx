"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setTriage } from "@/app/actions/queue";
import { PatientSearchSelect } from "@/components/patient-search-select";
import { toast } from "sonner";

export default function TriagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [waitingTickets, setWaitingTickets] = useState<any[]>([]);
  const [nurseId, setNurseId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [department, setDepartment] = useState("GEN");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");

  const priorityBadgeClass = (p: string | null | undefined) => {
    if (p === "RED") return "badge badge-high";
    if (p === "YELLOW") return "badge badge-medium";
    return "badge badge-low";
  };
  const priorityLabel = (p: string | null | undefined) => {
    if (p === "RED") return "HIGH";
    if (p === "YELLOW") return "MEDIUM";
    return "LOW";
  };

  const fetchWaiting = useCallback(async () => {
    const qs = `department=${encodeURIComponent(department)}`;
    const res = await fetch(`/api/queue?${qs}`);
    const data = await res.json();
    setWaitingTickets(data.tickets ?? []);
  }, [department]);

  useEffect(() => {
    // Autofill nurse id
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const me = await res.json();
          if (me?.id) setNurseId(me.id);
          if (me?.department) setDepartment(me.department);
        }
      } catch {}
    })();
    fetchWaiting();
  }, [fetchWaiting]);

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
    const channel = supabase
      .channel("queue-nurse")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => {
        fetchWaiting();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchWaiting]);

  async function checkin() {
    if (!selectedPatient?.id) return;
    const body: any = { intakeType: "WALK_IN", patientId: selectedPatient.id, department };
    try {
      await (await import("@/app/actions/queue")).enqueueVisit(body);
      setSelectedPatient(null);
      await fetchWaiting();
      toast.success("Patient checked in");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in");
    }
  }

  async function checkinFromList(id: number) {
    try {
      await (await import("@/app/actions/queue")).enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      await fetchWaiting();
      toast.success("Appointment checked in");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to check in appointment");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Nurse ID</label>
          <Input value={nurseId} disabled />
        </div>
        <div>
          <label className="text-sm font-medium">Department</label>
          <Input value={department} disabled />
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {waitingTickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className={priorityBadgeClass(t.priority)}>{priorityLabel(t.priority)}</span>
                <span className="text-xs text-gray-500">Arrived {new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
                {t.doctor_name ? <span className="text-xs text-gray-500">Dr. {t.doctor_name}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!nurseId) return;
                    try {
                      await setTriage({ visitId: Number(t.visit_id), nurseId, priority: "GREEN" as any });
                      await fetchWaiting();
                      toast.success("Triage set to Low");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Failed to update triage");
                    }
                  }}
                >
                  Low
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!nurseId) return;
                    try {
                      await setTriage({ visitId: Number(t.visit_id), nurseId, priority: "YELLOW" as any });
                      await fetchWaiting();
                      toast.success("Triage set to Medium");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Failed to update triage");
                    }
                  }}
                >
                  Medium
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!nurseId) return;
                    try {
                      await setTriage({ visitId: Number(t.visit_id), nurseId, priority: "RED" as any });
                      await fetchWaiting();
                      toast.success("Triage set to High");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Failed to update triage");
                    }
                  }}
                >
                  High
                </Button>
              </div>
            </div>
          ))}
          {waitingTickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No waiting patients</div>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Check-in</div>
        <div className="p-4 grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium">Patient</label>
            <PatientSearchSelect onSelect={(p) => { setSelectedPatient(p); }} />
          </div>
          <div className="col-span-1 flex items-end"><Button onClick={checkin} disabled={!selectedPatient?.id}>Check-in</Button></div>
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
                  <Button size="sm" onClick={async () => { await checkinFromList(a.id); }}>Check-in</Button>
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
