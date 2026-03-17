"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Patient = { id: string; first_name: string; last_name: string; hospital_number?: string | null; phone?: string | null };

export function PatientSearchSelect({ onSelect, placeholder }: { onSelect: (p: Patient) => void; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Patient[]>([]);
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const q = query.trim();
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          if (q.length < 1) { setItems([]); return; }
          const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
          if (res.ok) {
            const data = await res.json();
            setItems((data?.items ?? []) as Patient[]);
          } else {
            setItems([]);
          }
        } catch {
          setItems([]);
        }
      })();
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query]);

  const selected = useMemo(() => items.find((i) => i.id === value), [items, value]);

  return (
    <Select value={value} onValueChange={(v) => { setValue(v); const p = items.find((i) => i.id === v); if (p) onSelect(p); }}>
      <SelectTrigger>
        <SelectValue placeholder={selected ? `${selected.first_name} ${selected.last_name}` : (placeholder ?? "Select patient")} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..." className="h-8" />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {items.map((p) => (
            <SelectItem key={p.id} value={p.id} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{p.first_name} {p.last_name}</span>
                <span className="text-xs text-gray-500">{p.hospital_number ? `HN ${p.hospital_number}` : p.phone}</span>
              </div>
            </SelectItem>
          ))}
          {items.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">Start typing to search patients</div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

