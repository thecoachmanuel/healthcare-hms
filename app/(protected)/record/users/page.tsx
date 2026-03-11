import { Table } from "@/components/tables/table";
import db from "@/lib/db";
import { format } from "date-fns";
import { BriefcaseBusiness } from "lucide-react";
import React from "react";

const columns = [
  {
    header: "user ID",
    key: "id",
    className: "hidden lg:table-cell",
  },
  {
    header: "Name",
    key: "name",
  },
  {
    header: "Email",
    key: "email",
    className: "hidden md:table-cell",
  },
  {
    header: "Role",
    key: "role",
  },
  {
    header: "Status",
    key: "status",
  },
  {
    header: "Last Login",
    key: "last_login",
    className: "hidden xl:table-cell",
  },
];

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: Date;
}

function formatRoleLabel(role: string) {
  if (role === "LAB_TECHNICIAN" || role === "lab_technician" || role === "lab_scientist") {
    return "lab scientist";
  }
  return role.toLowerCase().replaceAll("_", " ");
}
const UserPage = async () => {
  const [staff, doctors, patients] = await Promise.all([
    db.staff.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, updated_at: true },
      orderBy: { created_at: "desc" },
    }),
    db.doctor.findMany({
      select: { id: true, name: true, email: true, updated_at: true },
      orderBy: { created_at: "desc" },
    }),
    db.patient.findMany({
      select: { id: true, first_name: true, last_name: true, email: true, updated_at: true },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const data: UserProps[] = [
    ...staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: formatRoleLabel(s.role),
      status: s.status.toLowerCase(),
      last_login: s.updated_at,
    })),
    ...doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: formatRoleLabel("doctor"),
      status: "active",
      last_login: d.updated_at,
    })),
    ...patients.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      email: p.email,
      role: formatRoleLabel("patient"),
      status: "active",
      last_login: p.updated_at,
    })),
  ];

  const totalCount = data.length;

  const renderRow = (item: UserProps) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-base hover:bg-slate-50"
    >
      <td className="hidden lg:table-cell items-center">{item?.id}</td>
      <td className="table-cell py-2 xl:py-4">
        {item?.name}
      </td>
      <td className="table-cell">{item?.email}</td>
      <td className="table-cell capitalize">{item?.role}</td>
      <td className="hidden md:table-cell capitalize">{item?.status}</td>
      <td className="hidden md:table-cell capitalize">
        {format(item?.last_login, "yyyy-MM-dd h:mm:ss")}
      </td>
    </tr>
  );
  return (
    <div className="bg-white rounded-xl p-2 md:p-4 2xl:p-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <BriefcaseBusiness size={20} className="text-gray-500" />

          <p className="text-2xl font-semibold">{totalCount}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            total users
          </span>
        </div>
      </div>

      <div>
        <Table columns={columns} data={data} renderRow={renderRow} />
      </div>
    </div>
  );
};

export default UserPage;
