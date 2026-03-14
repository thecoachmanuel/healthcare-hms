"use client";
import React, { useState } from "react";

export default function ProvidersClient({ providers }: { providers: { id: number; name: string; code: string | null; active: boolean }[] }) {
  const [items, setItems] = useState(providers);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProvider = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/hmo-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "Failed to create provider");
        setLoading(false);
        return;
      }
      setItems((prev) => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setCode("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create provider");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      const res = await fetch("/api/hmo-providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) return;
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
    } catch {}
  };

  const removeProvider = async (id: number) => {
    const ok = window.confirm("Delete this provider?");
    if (!ok) return;
    try {
      const res = await fetch("/api/hmo-providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) return;
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">HMO / Insurance Providers</h2>
        <p className="text-gray-600 text-sm">Manage the list of providers available for patient selection.</p>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm">Provider Name</label>
            <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AXA Mansard" />
          </div>
          <div className="flex-1">
            <label className="text-sm">Code (optional)</label>
            <input className="w-full border rounded-md px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. NHIS" />
          </div>
          <button disabled={loading || !name.trim()} onClick={addProvider} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">
            {loading ? "Adding..." : "Add Provider"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th className="py-2 hidden md:table-cell">Code</th>
              <th className="py-2">Active</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.name}</td>
                <td className="py-2 hidden md:table-cell">{p.code ?? "-"}</td>
                <td className="py-2">
                  <button
                    onClick={() => toggleActive(p.id, !p.active)}
                    className={"px-2 py-1 rounded-md text-xs " + (p.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700")}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="py-2">
                  <button onClick={() => removeProvider(p.id)} className="px-2 py-1 rounded-md text-xs bg-rose-100 text-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
