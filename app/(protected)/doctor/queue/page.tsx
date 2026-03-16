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
  const [checkinPatientId, setCheckinPatientId] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [delayMinutes, setDelayMinutes] = useState("0");
  const [delayMessage, setDelayMessage] = useState("");

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
    if (!doctorId) return;
    (async () => {
      try {
        const res = await fetch(`/api/doctor/status?doctorId=${encodeURIComponent(doctorId)}`);
        if (res.ok) {
          const data = await res.json();
          setIsAvailable(Boolean(data?.is_available));
        }
      } catch {}
    })();
  }, [doctorId]);

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
    if (!checkinPatientId) return;
    await (await import("@/app/actions/queue")).enqueueVisit({ patientId: checkinPatientId, doctorId, department, intakeType: "WALK_IN" });
    setCheckinPatientId("");
    await fetchQueue();
  }

  async function onToggleAvailability() {
    if (!doctorId || isAvailable == null) return;
    await setDoctorAvailability(doctorId, !isAvailable);
    setIsAvailable(!isAvailable);
  }

  async function onBroadcastDelay() {
    if (!doctorId) return;
    const mins = parseInt(delayMinutes || "0", 10);
    if (Number.isNaN(mins) || mins < 0) return;
    await setDoctorDelay(doctorId, mins, delayMessage || undefined);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Doctor ID</label>
          <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Department</label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={onCallNext}>Call Next</Button>
          <Button variant={isAvailable ? "secondary" : "default"} onClick={onToggleAvailability}>{isAvailable ? "Set Unavailable" : "Set Available"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Patient ID</label>
          <Input value={checkinPatientId} onChange={(e) => setCheckinPatientId(e.target.value)} />
        </div>
        <div className="flex items-end"><Button onClick={onCheckinPatient}>Check-in</Button></div>
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
                <span className="text-sm">{t.priority}</span>
                <span className="text-xs text-gray-500">{new Date(t.arrival_time).toLocaleTimeString()}</span>
                <span className="text-xs text-gray-600">~{Math.max(idx, 0) * avgMinutesPerPatient} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={async () => { await markInConsultation(t.id, doctorId); setCurrent(t); }}>Start</Button>
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
              <span className="text-sm">{current.priority}</span>
            </div>
            <Button onClick={async () => { await completeConsultation(current.id, doctorId); setCurrent(null); await fetchQueue(); }}>Complete</Button>
          </div>
        </div>
      )}
    </div>
  );
}
