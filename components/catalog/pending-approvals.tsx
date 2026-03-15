"use client";

import { useMemo, useState } from "react";
import { bulkApproveLabTests, bulkDeletePendingLabTests, updateLabTestCatalogItem, deletePendingLabTest } from "@/app/actions/catalog";
import { toast } from "sonner";

export function PendingApprovals({ items, canEdit }: { items: any[]; canEdit: boolean }) {
  const [selected, setSelected] = useState<number[]>([]);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = selected.length > 0 && selected.length === items.length;

  const toggleAll = () => {
    setSelected((prev) => (prev.length === items.length ? [] : [...allIds]));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <form action={async (fd: FormData) => {
          fd.set("ids", JSON.stringify(selected));
          const res = await bulkApproveLabTests(fd);
          if (res.success) toast.success(res.msg || "Approved");
          else toast.error(res.msg || "Failed");
        }}>
          <button type="submit" disabled={selected.length === 0} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve Selected</button>
        </form>
        <form action={async (fd: FormData) => {
          fd.set("ids", JSON.stringify(selected));
          const res = await bulkDeletePendingLabTests(fd);
          if (res.success) toast.success(res.msg || "Deleted");
          else toast.error(res.msg || "Failed");
        }}>
          <button type="submit" disabled={selected.length === 0} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Delete Selected</button>
        </form>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="py-2 px-2">S/N</th>
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Price</th>
              <th className="py-2 px-2 hidden md:table-cell">Created By</th>
              <th className="py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s: any, idx: number) => (
              <tr key={s.id} className="border-b hover:bg-slate-50">
                <td className="py-2 px-2"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} /></td>
                <td className="py-2 px-2">{idx + 1}</td>
                <td className="py-2 px-2">{s.service_name}</td>
                <td className="py-2 px-2">{Number(s.price).toFixed(2)}</td>
                <td className="py-2 px-2 hidden md:table-cell">{String(s.created_by_role || "-")}</td>
                <td className="py-2 px-2 flex items-center gap-2">
                  {canEdit ? (
                    <form
                      action={async (fd: FormData) => {
                        const name = (fd.get("name") as string) || s.service_name;
                        const price = Number(fd.get("price") || s.price);
                        const desc = (fd.get("description") as string) || s.description || "";
                        const res = await updateLabTestCatalogItem({ id: s.id, service_name: name, price, description: desc, lab_unit_id: s.lab_unit_id });
                        if (res.success) toast.success("Updated"); else toast.error(res.msg || "Failed");
                      }}
                    >
                      <input name="name" defaultValue={s.service_name} className="border rounded px-2 py-1 text-xs mr-2" />
                      <input name="price" defaultValue={String(s.price)} className="border rounded px-2 py-1 text-xs mr-2 w-24" />
                      <input name="description" defaultValue={s.description || ""} className="border rounded px-2 py-1 text-xs mr-2 hidden md:inline-block w-48" />
                      <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Save</button>
                    </form>
                  ) : null}
                  <form action={async () => { const r = await deletePendingLabTest(s.id); if (r.success) toast.success("Deleted"); else toast.error(r.msg || "Failed"); }}>
                    <button className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">No pending items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

