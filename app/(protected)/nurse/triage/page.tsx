"use client";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    fetchUntriaged();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("triage")
      .on("postgres_changes", { event: "*", schema: "public", table: "Triage" }, () => fetchUntriaged())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [supabase]);

  async function fetchUntriaged() {
    const res = await fetch(`/api/triage`);
    const data = await res.json();
    setUntriaged(data.items ?? []);
  }

  async function assign() {
    if (!visitId || !nurseId) return;
    await setTriage({ visitId: Number(visitId), nurseId, priority: priority as any });
    setVisitId("");
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
    </div>
  );
}

