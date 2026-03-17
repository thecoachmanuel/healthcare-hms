"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setTriage } from "@/app/actions/queue";
import { PatientSearchSelect } from "@/components/patient-search-select";

export default function TriagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [untriaged, setUntriaged] = useState<any[]>([]);
  const [waitingTickets, setWaitingTickets] = useState<any[]>([]);
  const [visitId, setVisitId] = useState<string>("");
  const [priority, setPriority] = useState("GREEN");
  const [nurseId, setNurseId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [checkinAppointmentId, setCheckinAppointmentId] = useState("");
  const [department, setDepartment] = useState("GEN");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");
  const [patientActiveIndex, setPatientActiveIndex] = useState(-1);

  const priorityBadgeClass = (p: string | null | undefined) => {
    if (p === "RED") return "bg-red-100 text-red-800";
    if (p === "YELLOW") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };
  const priorityLabel = (p: string | null | undefined) => {
    if (p === "RED") return "HIGH";
    if (p === "YELLOW") return "MEDIUM";
    return "LOW";
  };

  const fetchUntriaged = useCallback(async () => {
    const res = await fetch(`/api/triage`);
    const data = await res.json();
    setUntriaged(data.items ?? []);
  }, []);

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
    fetchUntriaged();
    fetchWaiting();
  }, [fetchUntriaged, fetchWaiting]);

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
      .channel("triage")
      .on("postgres_changes", { event: "*", schema: "public", table: "Triage" }, () => fetchUntriaged())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchUntriaged]);

  useEffect(() => {
    const channel = supabase
      .channel("queue-nurse")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => {
        fetchUntriaged();
        fetchWaiting();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchUntriaged, fetchWaiting]);

  useEffect(() => {
    const q = patientQuery.trim();
    if (q.length < 1) {
      setPatientResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
          if (res.ok) {
            const data = await res.json();
            setPatientResults(data.items ?? []);
          }
        } catch {
          setPatientResults([]);
        }
      })();
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [patientQuery]);

  async function assign() {
    if (!visitId || !nurseId) return;
    await setTriage({ visitId: Number(visitId), nurseId, priority: priority as any });
    setVisitId("");
    await fetchUntriaged();
  }

  async function checkin() {
    if (!selectedPatient?.id) return;
    const body: any = { intakeType: "WALK_IN", patientId: selectedPatient.id, department };
    await (await import("@/app/actions/queue")).enqueueVisit(body);
    setSelectedPatient(null);
    setPatientQuery("");
    setPatientResults([]);
    await fetchUntriaged();
  }

  async function checkinFromList(id: number) {
    await (await import("@/app/actions/queue")).enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
    await fetchUntriaged();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium">Select Visit</label>
          <Select value={visitId} onValueChange={setVisitId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an untriaged visit" />
            </SelectTrigger>
            <SelectContent>
              {untriaged.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  Visit {v.id} - {v.patient_first_name} {v.patient_last_name}
                  {v.patient_hospital_number ? ` (HN ${v.patient_hospital_number})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1">
          <label className="text-sm font-medium">Nurse ID</label>
          <Input value={nurseId} disabled />
        </div>
        <div className="col-span-1">
          <label className="text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RED">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>RED</span>
                </span>
              </SelectItem>
              <SelectItem value="YELLOW">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span>YELLOW</span>
                </span>
              </SelectItem>
              <SelectItem value="GREEN">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span>GREEN</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-4 flex justify-end"><Button onClick={assign} disabled={!visitId || !nurseId}>Set Triage</Button></div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Untriaged Visits</div>
        <div className="divide-y">
          {untriaged.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm">Visit {v.id}</span>
                <span className="text-sm text-gray-700">{v.patient_first_name} {v.patient_last_name}</span>
                {v.patient_hospital_number ? <span className="text-xs text-gray-500">HN {v.patient_hospital_number}</span> : null}
                <span className="text-xs text-gray-500">Arrived {new Date(v.arrived_at).toLocaleTimeString()}</span>
              </div>
              <div className="text-xs text-gray-500">Dept {v.department ?? "-"}{v.doctor_name ? ` • Dr. ${v.doctor_name}` : ""}</div>
            </div>
          ))}
          {untriaged.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No pending triage</div>}
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {waitingTickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className={`text-xs px-2 py-1 rounded ${priorityBadgeClass(t.priority)}`}>{priorityLabel(t.priority)}</span>
                <span className="text-xs text-gray-500">Arrived {new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
                {t.doctor_name ? <span className="text-xs text-gray-500">Dr. {t.doctor_name}</span> : null}
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
            <PatientSearchSelect onSelect={(p) => { setSelectedPatient(p); setPatientResults([]); setPatientQuery(""); setPatientActiveIndex(-1); }} />
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
