"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PatientSearchSelect } from "@/components/patient-search-select";
import { callNextPatient, markInConsultation, completeConsultation, skipTicket, setDoctorAvailability, setDoctorDelay } from "@/app/actions/queue";

export default function DoctorQueuePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [department, setDepartment] = useState("GEN");
  const [tickets, setTickets] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const avgMinutesPerPatient = 10;
  
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState("0");
  const [delayMessage, setDelayMessage] = useState("");
  const [delaySending, setDelaySending] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");
  

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

  // replaced by PatientSearchSelect dropdown

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
    const minsRaw = parseInt(delayMinutes || "0", 10);
    const mins = Number.isNaN(minsRaw) ? NaN : Math.min(Math.max(minsRaw, 0), 240);
    if (Number.isNaN(mins)) {
      toast.error("Enter a valid delay in minutes");
      return;
    }
    setDelaySending(true);
    try {
      const res = await setDoctorDelay(doctorId, mins, delayMessage || undefined);
      toast.success(`Delay sent to ${(res as any)?.count ?? 0} patients`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to notify delay");
    } finally {
      setDelaySending(false);
    }
  }

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
          <PatientSearchSelect onSelect={(p) => { setSelectedPatient(p); }} />
        </div>
        <div className="flex items-end"><Button onClick={onCheckinPatient} disabled={!selectedPatient?.id}>Check-in</Button></div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Notify Delay</CardTitle>
          <CardDescription className="text-xs">Sends a notification to patients waiting in your queue.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-medium">Quick presets</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={parseInt(delayMinutes || "0", 10) === m ? "default" : "outline"}
                    onClick={() => setDelayMinutes(String(m))}
                  >
                    {m === 0 ? "Clear" : `${m}m`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium">Delay (minutes)</div>
                <Input type="number" min={0} max={240} value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} placeholder="e.g. 10" />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm font-medium">Message (optional)</div>
                <Input value={delayMessage} onChange={(e) => setDelayMessage(e.target.value)} placeholder="Optional message to patients" />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button variant="secondary" onClick={onBroadcastDelay} disabled={!doctorId || delaySending}>
                {delaySending ? "Sending…" : "Send Delay Notification"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-md overflow-x-auto">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {tickets.map((t, idx) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className={priorityBadgeClass(t.priority)}>{priorityLabel(t.priority)}</span>
                <span className="text-xs text-gray-500">{new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-xs text-gray-600">~{Math.max(idx, 0) * avgMinutesPerPatient} min</span>
                <span className="text-sm text-gray-700">{t.patient_first_name} {t.patient_last_name}</span>
                {t.patient_hospital_number ? <span className="text-xs text-gray-500">HN {t.patient_hospital_number}</span> : null}
              </div>
                  <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!doctorId) return;
                    await markInConsultation(t.id, doctorId);
                    setCurrent(t);
                    setIsAvailable(false);
                    setTickets((prev) => prev.filter((x) => x.id !== t.id));
                    await fetchQueue();
                  }}
                >
                  Start
                </Button>
                {t.appointment_id ? (
                  <>
                    <Button size="sm" variant="destructive" onClick={async () => { const fn = (await import("@/app/actions/queue")).skipTicketWithReason; await fn(t.id, "CANCELLED"); await fetchQueue(); }}>Cancel</Button>
                    <Button size="sm" variant="destructive" onClick={async () => { const fn = (await import("@/app/actions/queue")).skipTicketWithReason; await fn(t.id, "NO_SHOW"); await fetchQueue(); }}>No-show</Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={async () => { await skipTicket(t.id); await fetchQueue(); }}>Skip</Button>
                )}
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">No waiting patients</div>
          )}
        </div>
      </div>

      {current && (
        <div className="border rounded-md overflow-x-auto">
          <div className="px-4 py-2 text-sm font-semibold bg-gray-50">In Consultation</div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">{current.queue_number}</span>
              <span className={priorityBadgeClass(current.priority)}>{priorityLabel(current.priority)}</span>
              {current.patient_first_name ? <span className="text-sm text-gray-700">{current.patient_first_name} {current.patient_last_name}</span> : null}
            </div>
            <Button onClick={async () => { await completeConsultation(current.id, doctorId); const apptId = (current as any)?.appointment_id; setCurrent(null); setIsAvailable(true); await fetchQueue(); if (apptId) { router.push(`/record/appointments/${apptId}?cat=diagnosis`); } }}>Complete</Button>
          </div>
        </div>
      )}

      <div className="border rounded-md overflow-x-auto">
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
