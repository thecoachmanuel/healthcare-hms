import { ActionDialog } from "@/components/action-dialog";
import { ActionOptions, EditAction, ViewAction } from "@/components/action-options";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { TextFilter } from "@/components/filters/text-filter";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { calculateAge } from "@/utils";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getAllPatients } from "@/utils/services/patient";
import { Patient } from "@prisma/client";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { AddPatientDialog } from "@/components/dialogs/add-patient-dialog";

const columns = [
  {
    header: "Patient Name",
    key: "name",
  },
  {
    header: "Gender",
    key: "gender",
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
    header: "Address",
    key: "address",
    className: "hidden xl:table-cell",
  },
  {
    header: "Last Visit",
    key: "created_at",
    className: "hidden lg:table-cell",
  },
  {
    header: "Last Treatment",
    key: "treatment",
    className: "hidden 2xl:table-cell",
  },
  {
    header: "Actions",
    key: "action",
  },
];

interface PatientProps extends Patient {
  appointments: {
    medical: {
      created_at: Date;
      treatment_plan: string;
    }[];
  }[];
}
const PatientList = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;
  const gender = (searchParams?.gender || "") as string;
  const hn = (searchParams?.hn || "") as string;
  const admission = (searchParams?.admission || "") as string;

  const { data, totalPages, totalRecords, currentPage } = await getAllPatients({
    page,
    search: searchQuery,
    gender: gender || undefined,
    hospitalNumber: hn || undefined,
    admission:
      admission === "ADMITTED" || admission === "NOT_ADMITTED"
        ? (admission as any)
        : undefined,
  });
  const isAdmin = await checkRole("ADMIN");
  const isRecordOfficer = await checkRole("RECORD_OFFICER");

  if (!data) return null;

  const renderRow = (item: PatientProps) => {
    const lastVisit = item?.appointments[0]?.medical[0] || null;

    const name = item?.first_name + " " + item?.last_name;

    return (
      <tr
        key={item?.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
      >
        <td className="flex items-center gap-4 p-4">
          <ProfileImage
            url={item?.img!}
            name={name}
            bgColor={item?.colorCode!}
            textClassName="text-black"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="uppercase">{name}</h3>
              {(item as any)?.isAdmitted ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Admitted{(item as any)?.currentAdmission?.wardName ? ` • ${(item as any).currentAdmission.wardName}` : ""}
                </span>
              ) : null}
            </div>
            <span className="text-sm capitalize">
              {calculateAge(item?.date_of_birth)}
            </span>
          </div>
        </td>
        <td className="hidden md:table-cell">{item?.gender}</td>
        <td className="hidden md:table-cell">{item?.phone}</td>
        <td className="hidden lg:table-cell">{item?.email}</td>
        <td className="hidden xl:table-cell">{item?.address}</td>
        <td className="hidden xl:table-cell">
          {lastVisit ? (
            format(lastVisit?.created_at, "yyyy-MM-dd HH:mm:ss")
          ) : (
            <span className="text-gray-400 italic">No last visit</span>
          )}
        </td>
        <td className="hidden xl:table-cell">
          {lastVisit ? (
            lastVisit?.treatment_plan
          ) : (
            <span className="text-gray-400 italic">No last treatment</span>
          )}
        </td>
        <td>
          <div className="flex items-center gap-2">
            <ViewAction href={`/patient/${item?.id}`} />

            <ActionOptions>
              <div className="space-y-3">
                {isAdmin && <EditAction href={`/record/patients/${item?.id}/edit`} />}

                {!isAdmin && isRecordOfficer && (
                  <EditAction href={`/record/patients/${item?.id}/edit`} />
                )}

                {isAdmin && (
                  <ActionDialog
                    type="delete"
                    id={item.id}
                    deleteType="patient"
                  />
                )}
              </div>
            </ActionOptions>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <Users size={20} className="text-gray-500" />

          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            total patients
          </span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
          {(isAdmin || isRecordOfficer) && <AddPatientDialog />}
          <SelectFilter
            param="gender"
            label="Gender"
            options={[
              { label: "All", value: "" },
              { label: "Male", value: "MALE" },
              { label: "Female", value: "FEMALE" },
            ]}
          />
          <SelectFilter
            param="admission"
            label="Admission"
            options={[
              { label: "All", value: "" },
              { label: "Admitted", value: "ADMITTED" },
              { label: "Not admitted", value: "NOT_ADMITTED" },
            ]}
          />
          <TextFilter param="hn" label="HN" placeholder="Hospital #" />
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

export default PatientList;
