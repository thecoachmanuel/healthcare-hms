import { Pagination } from "@/components/pagination";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAuditLogs } from "@/utils/services/audit-logs";
type AuditLogRow = {
  id: number;
  user_id: string;
  record_id: string;
  action: string;
  details: string | null;
  model: string;
  created_at: Date;
};
import { format } from "date-fns";
import React from "react";

const columns = [
  { header: "Time", key: "time" },
  { header: "User", key: "user", className: "hidden md:table-cell" },
  { header: "Action", key: "action", className: "hidden md:table-cell" },
  { header: "Model", key: "model", className: "hidden md:table-cell" },
  { header: "Record", key: "record", className: "hidden xl:table-cell" },
  { header: "Details", key: "details", className: "hidden xl:table-cell" },
];

const AuditLogsPage = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getAuditLogs({
    page,
    search: searchQuery,
    limit: DATA_LIMIT,
  });

  const renderRow = (item: AuditLogRow) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      <td className="py-2 xl:py-4">{format(item.created_at, "yyyy-MM-dd HH:mm")}</td>
      <td className="hidden md:table-cell">{item.user_id}</td>
      <td className="hidden md:table-cell">{item.action}</td>
      <td className="hidden md:table-cell">{item.model}</td>
      <td className="hidden xl:table-cell">{item.record_id}</td>
      <td className="hidden xl:table-cell w-[40%]">
        <p className="line-clamp-2">{item.details ?? ""}</p>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">total records</span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={data ?? []} renderRow={renderRow} />
        <Pagination totalPages={totalPages} currentPage={currentPage} totalRecords={totalRecords} limit={DATA_LIMIT} />
      </div>
    </div>
  );
};

export default AuditLogsPage;
