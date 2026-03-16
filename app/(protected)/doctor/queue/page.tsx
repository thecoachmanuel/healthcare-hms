"use client";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callNextPatient, markInConsultation, completeConsultation, skipTicket } from "@/app/actions/queue";

export default function DoctorQueuePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [doctorId, setDoctorId] = useState("");
  const [department, setDepartment] = useState("GEN");
  const [tickets, setTickets] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);

  useEffect(() => {
    if (!doctorId && !department) return;
    fetchQueue();
  }, [doctorId, department]);

  useEffect(() => {
    const channel = supabase
      .channel("queue-doc")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => fetchQueue())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [supabase, doctorId, department]);

  async function fetchQueue() {
    const qs = doctorId ? `doctorId=${doctorId}` : `department=${department}`;
    const res = await fetch(`/api/queue?${qs}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }

  async function onCallNext() {
    if (!doctorId) return;
    const res = await callNextPatient(doctorId, department);
    if ((res as any).success) await fetchQueue();
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
        <div className="flex items-end"><Button onClick={onCallNext}>Call Next</Button></div>
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-2 text-sm font-semibold bg-gray-50">Waiting Queue</div>
        <div className="divide-y">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{t.queue_number}</span>
                <span className="text-sm">{t.priority}</span>
                <span className="text-xs text-gray-500">{new Date(t.arrival_time).toLocaleTimeString()}</span>
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

