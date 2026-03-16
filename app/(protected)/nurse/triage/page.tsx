"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setTriage } from "@/app/actions/queue";

export default function TriagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [untriaged, setUntriaged] = useState<any[]>([]);
  const [visitId, setVisitId] = useState("");
  const [priority, setPriority] = useState("GREEN");
  const [nurseId, setNurseId] = useState("");
  const [checkinPatientId, setCheckinPatientId] = useState("");
  const [checkinAppointmentId, setCheckinAppointmentId] = useState("");
  const [department, setDepartment] = useState("GEN");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptQuery, setApptQuery] = useState("");

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

  async function assign() {
    if (!visitId || !nurseId) return;
    await setTriage({ visitId: Number(visitId), nurseId, priority: priority as any });
    setVisitId("");
    await fetchUntriaged();
  }

  async function checkin() {
    if (!checkinPatientId && !checkinAppointmentId) return;
    const body: any = { intakeType: checkinAppointmentId ? "APPOINTMENT" : "WALK_IN" };
    if (checkinPatientId) body.patientId = checkinPatientId;
    if (checkinAppointmentId) body.appointmentId = Number(checkinAppointmentId);
    await (await import("@/app/actions/queue")).enqueueVisit(body);
    setCheckinPatientId("");
    setCheckinAppointmentId("");
    await fetchUntriaged();
  }

  async function checkinFromList(id: number) {
    await (await import("@/app/actions/queue")).enqueueVisit({ appointmentId: id, intakeType: "APPOINTMENT" });
    await fetchUntriaged();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className="text-sm font-medium">Visit ID</label>
          <Input value={visitId} onChange={(e) => setVisitId(e.target.value)} />
        </div>
        <div className="col-span-1">
          <label className="text-sm font-medium">Nurse ID</label>
          <Input value={nurseId} onChange={(e) => setNurseId(e.target.value)} />
        </div>
        <div className="col-span-1">
          <label className="text-sm font-medium">Priority</label>
          <select className="border rounded h-10 px-2 w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="RED">RED</option>
            <option value="YELLOW">YELLOW</option>
            <option value="GREEN">GREEN</option>
          </select>
        </div>
        <div className="col-span-1 flex items-end"><Button onClick={assign}>Set Triage</Button></div>
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Untriaged Visits</div>
        <div className="divide-y">
          {untriaged.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm">Visit {v.id}</span>
                <span className="text-xs text-gray-500">Arrived {new Date(v.arrived_at).toLocaleTimeString()}</span>
              </div>
              <div className="text-xs text-gray-500">Dept {v.department ?? "-"}</div>
            </div>
          ))}
          {untriaged.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No pending triage</div>}
        </div>
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Check-in</div>
        <div className="p-4 grid grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium">Patient ID</label>
            <Input value={checkinPatientId} onChange={(e) => setCheckinPatientId(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Appointment ID</label>
            <Input value={checkinAppointmentId} onChange={(e) => setCheckinAppointmentId(e.target.value)} />
          </div>
          <div className="col-span-2 flex items-end"><Button onClick={checkin}>Check-in</Button></div>
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
                const t = `${a.time ?? ""} ${a.type ?? ""}`.toLowerCase();
                return apptQuery.trim() ? t.includes(apptQuery.toLowerCase()) : true;
              })
              .map((a) => (
              <div key={a.id} className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">#{a.id}</span>
                  <span className="text-sm">{a.type}</span>
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
