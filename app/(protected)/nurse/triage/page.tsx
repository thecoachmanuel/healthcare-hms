"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setTriage } from "@/app/actions/queue";

export default function TriagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [untriaged, setUntriaged] = useState<any[]>([]);
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

  const fetchUntriaged = useCallback(async () => {
    const res = await fetch(`/api/triage`);
    const data = await res.json();
    setUntriaged(data.items ?? []);
  }, []);

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
  }, [fetchUntriaged]);

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
    const q = patientQuery.trim();
    if (q.length < 2) {
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
              <SelectItem value="RED">RED</SelectItem>
              <SelectItem value="YELLOW">YELLOW</SelectItem>
              <SelectItem value="GREEN">GREEN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-4 flex justify-end"><Button onClick={assign} disabled={!visitId || !nurseId}>Set Triage</Button></div>
      </div>

      <div className="border rounded-md">
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

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Check-in</div>
        <div className="p-4 grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium">Patient</label>
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
                  if (patientActiveIndex >= 0 && patientActiveIndex < patientResults.length) {
                    const p = patientResults[patientActiveIndex];
                    setSelectedPatient(p);
                    setPatientResults([]);
                    setPatientQuery("");
                    setPatientActiveIndex(-1);
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
