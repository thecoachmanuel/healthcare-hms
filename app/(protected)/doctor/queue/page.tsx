"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callNextPatient, markInConsultation, completeConsultation, skipTicket, setDoctorAvailability, setDoctorDelay } from "@/app/actions/queue";

export default function DoctorQueuePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [doctorId, setDoctorId] = useState("");
  const [department, setDepartment] = useState("GEN");
  const [tickets, setTickets] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const avgMinutesPerPatient = 10;
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState("0");
  const [delayMessage, setDelayMessage] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");
  const [patientActiveIndex, setPatientActiveIndex] = useState(-1);

  const fetchQueue = useCallback(async () => {
    const qs = doctorId ? `doctorId=${doctorId}` : `department=${department}`;
    const res = await fetch(`/api/queue?${qs}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }, [doctorId, department]);

  useEffect(() => {
    // Autofill doctor id and department from current user
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const me = await res.json();
          if (me?.id) setDoctorId(me.id);
          if (me?.department) setDepartment(me.department);
        }
      } catch {}
    })();
    if (!doctorId && !department) return;
    fetchQueue();
  }, [doctorId, department, fetchQueue]);

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

  const fetchAvailability = useCallback(async () => {
    if (!doctorId) return;
    setAvailabilityLoading(true);
    try {
      const res = await fetch(`/api/doctor/status?doctorId=${encodeURIComponent(doctorId)}`);
      if (res.ok) {
        const data = await res.json();
        setIsAvailable(typeof data?.is_available === "boolean" ? data.is_available : Boolean(data?.is_available));
      } else {
        setIsAvailable(true);
      }
    } catch {
      setIsAvailable(true);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!department) return;
    (async () => {
      const res = await fetch(`/api/appointments/today?department=${encodeURIComponent(department)}&doctorId=${encodeURIComponent(doctorId)}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.items ?? []);
      }
    })();
  }, [department, doctorId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    const channel = supabase
      .channel("queue-doc")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => fetchQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchQueue]);

  async function onCallNext() {
    if (!doctorId) return;
    const res = await callNextPatient(doctorId, department);
    if ((res as any).success) await fetchQueue();
  }

  async function onCheckinPatient() {
    if (!selectedPatient?.id) return;
    await (await import("@/app/actions/queue")).enqueueVisit({ patientId: selectedPatient.id, doctorId, department, intakeType: "WALK_IN" });
    setSelectedPatient(null);
    setPatientQuery("");
    setPatientResults([]);
    await fetchQueue();
  }

  async function onCheckInAppointmentFromList(id: number) {
    await (await import("@/app/actions/queue")).enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
    await fetchQueue();
  }

  async function onToggleAvailability() {
    if (!doctorId || isAvailable == null) {
      await fetchAvailability();
      return;
    }
    setAvailabilityLoading(true);
    try {
      await setDoctorAvailability(doctorId, !isAvailable);
      await fetchAvailability();
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function onBroadcastDelay() {
    if (!doctorId) return;
    const mins = parseInt(delayMinutes || "0", 10);
    if (Number.isNaN(mins) || mins < 0) return;
    await setDoctorDelay(doctorId, mins, delayMessage || undefined);
  }

  const priorityBadgeClass = (p: string | null | undefined) => {
    if (p === "RED") return "bg-red-100 text-red-800";
    if (p === "YELLOW") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Doctor ID</label>
          <Input value={doctorId} disabled />
        </div>
        <div>
          <label className="text-sm font-medium">Department</label>
          <Input value={department} disabled />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={onCallNext}>Call Next</Button>
          <Button
            variant={isAvailable ? "secondary" : "default"}
            onClick={onToggleAvailability}
            disabled={!doctorId || isAvailable == null || availabilityLoading}
          >
            {availabilityLoading ? "Updating…" : isAvailable ? "Set Unavailable" : "Set Available"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
          <div className="mt-1 text-xs text-gray-500">Type to search. Use ↑/↓ then Enter to select.</div>
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
        <div className="flex items-end"><Button onClick={onCheckinPatient} disabled={!selectedPatient?.id}>Check-in</Button></div>
        <div className="flex items-end gap-2">
          <Input value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} placeholder="Delay minutes" />
          <Input value={delayMessage} onChange={(e) => setDelayMessage(e.target.value)} placeholder="Optional message" />
          <Button variant="secondary" onClick={onBroadcastDelay}>Notify Delay</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {tickets.map((t, idx) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className={`text-xs px-2 py-1 rounded ${priorityBadgeClass(t.priority)}`}>{t.priority}</span>
                <span className="text-xs text-gray-500">{new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-xs text-gray-600">~{Math.max(idx, 0) * avgMinutesPerPatient} min</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={async () => { await markInConsultation(t.id, doctorId); setCurrent(t); setIsAvailable(false); }}>Start</Button>
                <Button variant="destructive" onClick={async () => { await skipTicket(t.id); await fetchQueue(); }}>Skip</Button>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No waiting patients</div>
          )}
        </div>
      </div>

      {current && (
        <div className="border rounded-md">
          <div className="px-4 py-2 text-sm font-semibold bg-gray-50">In Consultation</div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">{current.queue_number}</span>
              <span className={`text-xs px-2 py-1 rounded ${priorityBadgeClass(current.priority)}`}>{current.priority}</span>
              {current.patient_first_name ? <span className="text-sm text-gray-700">{current.patient_first_name} {current.patient_last_name}</span> : null}
            </div>
            <Button onClick={async () => { await completeConsultation(current.id, doctorId); setCurrent(null); setIsAvailable(true); await fetchQueue(); }}>Complete</Button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Today's Appointments</div>
        <div className="p-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-sm font-medium">Search</label>
              <Input value={apptQuery} onChange={(e) => setApptQuery(e.target.value)} placeholder="Search patient or time" />
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
                    <span className="text-xs text-gray-600">{new Date(a.appointment_date).toISOString().slice(0,10)} {a.time}</span>
                  </div>
                  <Button size="sm" onClick={async () => { await onCheckInAppointmentFromList(a.id); }}>Check-in</Button>
                </div>
              ))}
            {appointments.length === 0 ? <div className="px-2 py-4 text-sm text-gray-500">No appointments for today</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
