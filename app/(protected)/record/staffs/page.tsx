import { ActionDialog } from "@/components/action-dialog";
import { EditAction } from "@/components/action-options";
import { StaffForm } from "@/components/forms/staff-form";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { DepartmentFilter } from "@/components/filters/department-filter";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllStaff } from "@/utils/services/staff";
import { Staff } from "@prisma/client";
import { format } from "date-fns";
import { Users } from "lucide-react";
import React from "react";
import db from "@/lib/db";
import { ensureDefaultLabUnits } from "@/utils/services/catalog-seed";
import { StatCard } from "@/components/stat-card";
import { StaffRoleChart } from "@/components/charts/staff-role-chart";
import { UserRound, UserX, UserCheck } from "lucide-react";

const columns = [
  {
    header: "Info",
    key: "name",
  },
  {
    header: "Role",
    key: "role",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    key: "contact",
    className: "hidden md:table-cell",
  },
  {
    header: "Email",
    key: "email",
    className: "hidden lg:table-cell",
  },
  {
    header: "Joined Date",
    key: "created_at",
    className: "hidden xl:table-cell",
  },
  {
    header: "Actions",
    key: "action",
  },
];

const StaffList = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;
  const role = (searchParams?.role || "") as string;
  const department = (searchParams?.department || "") as string;
  const unit = (searchParams?.unit || "") as string;

  const { data, totalPages, totalRecords, currentPage, stats } = await getAllStaff({
    page,
    search: searchQuery,
    role: role || undefined,
    department: department || undefined,
    unitId: unit || undefined,
  });
  await ensureDefaultLabUnits();
  const labUnits = await db.labUnit.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (!data) return null;
  const isAdmin = await checkRole("ADMIN");
  const activeCount = stats?.statusCounts?.find((s: any) => s.status === "ACTIVE")?.count ?? 0;
  const inactiveCount = stats?.statusCounts?.find((s: any) => s.status === "INACTIVE")?.count ?? 0;
  const roleChartData = (stats?.roleCounts ?? []).map((r: any) => ({
    role: String(r.role).replace(/_/g, " "),
    count: Number(r.count),
  }));

  const renderRow = (item: Staff) => (
    <tr
      key={item?.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="flex items-center gap-4 p-4">
        <ProfileImage
          url={item?.img!}
          name={item?.name}
          bgColor={item?.colorCode!}
          textClassName="text-black"
        />
        <div>
          <h3 className="uppercase">{item?.name}</h3>
          <span className="text-sm capitalize">{item?.phone}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">{item?.role}</td>
      <td className="hidden md:table-cell">{item?.phone}</td>
      <td className="hidden lg:table-cell">{item?.email}</td>
      <td className="hidden xl:table-cell">
        {format(item?.created_at, "yyyy-MM-dd")}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <ActionDialog type="staff" id={item?.id} data={item} />
          {isAdmin && <EditAction href={`/record/staffs/${item?.id}/edit`} />}

          {isAdmin && (
            <ActionDialog type="delete" id={item?.id} deleteType="staff" />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Total Staff"
          icon={UserRound}
          note="All staff matching current filters"
          value={totalRecords}
          link="/record/staffs"
        />
        <StatCard
          title="Active"
          icon={UserCheck}
          note="Currently active staff"
          value={activeCount}
          link="/record/staffs"
          iconClassName="text-emerald-600"
          className="bg-white"
        />
        <StatCard
          title="Inactive"
          icon={UserX}
          note="Deactivated staff"
          value={inactiveCount}
          link="/record/staffs"
          iconClassName="text-red-600"
          className="bg-white"
        />
      </div>

      {roleChartData.length > 0 && (
        <div className="mb-6">
          <StaffRoleChart data={roleChartData} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <Users size={20} className="text-gray-500" />

          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            total staffs
          </span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
          <DepartmentFilter />
          <SelectFilter
            param="role"
            label="Role"
            options={[
              { label: "All", value: "" },
              { label: "Admin", value: "ADMIN" },
              { label: "Nurse", value: "NURSE" },
              { label: "Lab Scientist", value: "LAB_SCIENTIST" },
              { label: "Lab Technician", value: "LAB_TECHNICIAN" },
              { label: "Cashier", value: "CASHIER" },
              { label: "Pharmacist", value: "PHARMACIST" },
              { label: "Record Officer", value: "RECORD_OFFICER" },
            ]}
          />
          <SelectFilter
            param="unit"
            label="Unit"
            options={[
              { label: "All", value: "" },
              ...labUnits.map((u: { id: number; name: string }) => ({
                label: u.name,
                value: String(u.id),
              })),
            ]}
          />
          {isAdmin && (
            <StaffForm
              labUnits={labUnits.map((u: { id: number; name: string }) => ({
                label: u.name,
                value: String(u.id),
              }))}
            />
          )}
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={data} renderRow={renderRow} />

        {totalPages && (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            totalRecords={totalRecords}
            limit={DATA_LIMIT}
          />
        )}
      </div>
    </div>
  );
};

export default StaffList;
