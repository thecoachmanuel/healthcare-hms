import { AdmissionDetailsSheet } from "@/components/admissions/admission-details-sheet";
import { Pagination } from "@/components/pagination";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import db from "@/lib/db";
import { DATA_LIMIT } from "@/utils/seetings";
import { format } from "date-fns";
import Link from "next/link";

const columns = [
  { header: "Patient", key: "patient" },
  { header: "Ward", key: "ward" },
  { header: "Attending", key: "attending", className: "hidden md:table-cell" },
  { header: "Admitted", key: "admitted" },
  { header: "Discharged", key: "discharged", className: "hidden md:table-cell" },
  { header: "Status", key: "status" },
  { header: "Action", key: "action" },
];

export default async function AdmissionsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const page = Number((sp?.p || "1") as string) || 1;
  const q = (sp?.q as string) || "";
  const status = (sp?.status as string) || "";
  const ward = (sp?.ward as string) || "";
  const limit = DATA_LIMIT;
  const skip = (page - 1) * limit;

  const wards = await db.ward.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const [admissions, total] = await Promise.all([
    db.inpatientAdmission.findMany({
      where: {
        AND: [
          ward ? ({ ward_id: Number(ward) } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  { patient: { first_name: { contains: q, mode: "insensitive" } } },
                  { patient: { last_name: { contains: q, mode: "insensitive" } } },
                  { patient: { hospital_number: { contains: q, mode: "insensitive" } } },
                ],
              } as any)
            : {},
        ],
      } as any,
      include: {
        ward: { select: { name: true } },
        attending_doctor: { select: { name: true } },
        patient: { select: { first_name: true, last_name: true, hospital_number: true, id: true } },
      },
      orderBy: { admitted_at: "desc" },
      skip,
      take: limit,
    }),
    db.inpatientAdmission.count({
      where: {
        AND: [
          ward ? ({ ward_id: Number(ward) } as any) : {},
          status ? ({ status: status as any } as any) : {},
          q
            ? ({
                OR: [
                  { patient: { first_name: { contains: q, mode: "insensitive" } } },
                  { patient: { last_name: { contains: q, mode: "insensitive" } } },
                  { patient: { hospital_number: { contains: q, mode: "insensitive" } } },
                ],
              } as any)
            : {},
        ],
      } as any,
    }),
  ]);

  const ids = admissions.map((a: any) => a.id);
  const logs = ids.length
    ? await db.auditLog.findMany({
        where: { model: "InpatientAdmission", record_id: { in: ids.map((id: number) => String(id)) } },
        orderBy: { created_at: "asc" },
        select: { id: true, record_id: true, action: true, details: true, created_at: true },
      })
    : [];
  const logsByRecord: Record<string, any[]> = logs.reduce((acc: any, l: any) => {
    (acc[l.record_id] ||= []).push(l);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / limit);

  const renderRow = (a: any) => {
    const p = a.patient;
    const pname = `${p.first_name} ${p.last_name}`.trim();
    return (
      <tr key={a.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50">
        <td className="py-3">
          <div className="flex items-center gap-2">
            <Link className="text-blue-600 hover:underline" href={`/patient/${p.id}?cat=admissions`}>{pname}</Link>
            {p.hospital_number && <span className="text-xs text-gray-500">{p.hospital_number}</span>}
          </div>
        </td>
        <td>{a.ward?.name ?? "—"}</td>
        <td className="hidden md:table-cell">{a.attending_doctor?.name ?? "—"}</td>
        <td>{a.admitted_at ? format(a.admitted_at, "yyyy-MM-dd") : "—"}</td>
        <td className="hidden md:table-cell">{a.discharged_at ? format(a.discharged_at, "yyyy-MM-dd") : "—"}</td>
        <td>{a.status}</td>
        <td>
          <AdmissionDetailsSheet
            admission={{
              id: a.id,
              status: a.status,
              wardName: a.ward?.name ?? null,
              attendingName: a.attending_doctor?.name ?? null,
              admitted_at: a.admitted_at,
              discharged_at: a.discharged_at,
              discharge_notes: a.discharge_notes ?? null,
              discharged_by_name: a.discharged_by_name ?? null,
            }}
            logs={(logsByRecord[String(a.id)] ?? []) as any}
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <p className="text-2xl font-semibold">{total}</p>
          <span className="text-gray-600 text-sm xl:text-base">total admissions</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <SelectFilter
            param="status"
            label="Status"
            options={[
              { label: "All", value: "" },
              { label: "Admitted", value: "ADMITTED" },
              { label: "Discharged", value: "DISCHARGED" },
              { label: "Transferred", value: "TRANSFERRED" },
            ]}
          />
          <SelectFilter
            param="ward"
            label="Ward"
            options={[{ label: "All", value: "" }, ...wards.map((w: any) => ({ label: w.name, value: String(w.id) }))]}
          />
        </div>
      </div>

      <div className="mt-4">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left py-2 ${c.className || ""}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>{admissions.map(renderRow)}</tbody>
        </table>
        <Pagination totalPages={totalPages} currentPage={page} totalRecords={total} limit={DATA_LIMIT} />
      </div>
    </div>
  );
}

