"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enqueueVisit, skipTicket, markNoShow } from "@/app/actions/queue";

export default function ReceptionQueuePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [department, setDepartment] = useState("GEN");
  const [patientId, setPatientId] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchQueue();
  }, [department]);

  useEffect(() => {
    const channel = supabase
      .channel("queue-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "QueueTicket" }, () => fetchQueue())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, department]);

  async function fetchQueue() {
    const res = await fetch(`/api/queue?department=${encodeURIComponent(department)}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }

  async function onEnqueue() {
    if (!patientId) return;
    await enqueueVisit({ patientId, department, intakeType: "WALK_IN" });
    setPatientId("");
    await fetchQueue();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium">Department</label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="GEN" />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Patient ID</label>
          <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="patient-id" />
        </div>
        <Button onClick={onEnqueue}>Enqueue Walk-in</Button>
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
    </div>
  );
}

