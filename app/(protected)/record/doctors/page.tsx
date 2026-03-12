import { ActionDialog } from "@/components/action-dialog";
import { EditAction, ViewAction } from "@/components/action-options";
import { DoctorForm } from "@/components/forms/doctor-form";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { DepartmentFilter } from "@/components/filters/department-filter";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllDoctors } from "@/utils/services/doctor";
import { Doctor } from "@prisma/client";
import { format } from "date-fns";
import { Users, User, UserCheck, UserX } from "lucide-react";
import React from "react";
import db from "@/lib/db";
import { ensureDefaultDoctorSpecializations } from "@/utils/services/catalog-seed";
import { StatCard } from "@/components/stat-card";
import { DoctorSpecializationChart } from "@/components/charts/doctor-specialization-chart";

const columns = [
  {
    header: "Info",
    key: "name",
  },
  {
    header: "License #",
    key: "license",
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

const DoctorsList = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;
  const specialization = (searchParams?.specialization || "") as string;
  const department = (searchParams?.department || "") as string;
  const type = (searchParams?.type || "") as string;

  const { data, totalPages, totalRecords, currentPage, stats } = await getAllDoctors({
    page,
    search: searchQuery,
    specialization: specialization || undefined,
    department: department || undefined,
    type: type || undefined,
  });

  if (!data) return null;
  const isAdmin = await checkRole("ADMIN");
  await ensureDefaultDoctorSpecializations();
  const specializationsDb = await db.doctorSpecialization.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { name: true, department: true },
  });
  const specializations =
    specializationsDb.length > 0
      ? specializationsDb.map((s: { name: string; department: string | null }) => ({
          label: s.name,
          value: s.name,
          department: s.department ?? "General",
        }))
      : [];

  const fullCount = stats?.typeCounts?.find((t: any) => t.type === "FULL")?.count ?? 0;
  const partCount = stats?.typeCounts?.find((t: any) => t.type === "PART")?.count ?? 0;
  const specializationChartData = (stats?.specializationCounts ?? [])
    .map((r: any) => ({
      specialization: String(r.specialization),
      count: Number(r.count),
    }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 12);

  const renderRow = (item: Doctor) => (
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
          <span className="text-sm capitalize">{item?.specialization}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">{item?.license_number}</td>
      <td className="hidden md:table-cell">{item?.phone}</td>
      <td className="hidden lg:table-cell">{item?.email}</td>
      <td className="hidden xl:table-cell">
        {format(item?.created_at, "yyyy-MM-dd")}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <ViewAction href={`/record/doctors/${item?.id}`} />
          {isAdmin && <EditAction href={`/record/doctors/${item?.id}/edit`} />}
          {isAdmin && (
            <ActionDialog type="delete" id={item?.id} deleteType="doctor" />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard
          title="Total Doctors"
          icon={User}
          note="All doctors matching current filters"
          value={totalRecords}
          link="/record/doctors"
        />
        <StatCard
          title="Full Time"
          icon={UserCheck}
          note="Doctors on full-time schedule"
          value={fullCount}
          link="/record/doctors?type=FULL"
          iconClassName="text-emerald-600"
        />
        <StatCard
          title="Part Time"
          icon={UserX}
          note="Doctors on part-time schedule"
          value={partCount}
          link="/record/doctors?type=PART"
          iconClassName="text-rose-600"
        />
      </div>

      {specializationChartData.length > 0 && (
        <div className="mb-6">
          <DoctorSpecializationChart data={specializationChartData} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <Users size={20} className="text-gray-500" />

          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            total doctors
          </span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
          <DepartmentFilter />
          <SelectFilter
            param="specialization"
            label="Specialization"
            options={[
              { label: "All", value: "" },
              ...specializations.map((s: any) => ({ label: s.label, value: s.value })),
            ]}
          />
          <SelectFilter
            param="type"
            label="Type"
            options={[
              { label: "All", value: "" },
              { label: "Full", value: "FULL" },
              { label: "Part", value: "PART" },
            ]}
          />
          {isAdmin && <DoctorForm specializations={specializations as any} />}
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

export default DoctorsList;
