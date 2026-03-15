import { MedicalHistoryContainer } from "@/components/medical-history-container";
import { PatientRatingContainer } from "@/components/patient-rating-container";
import { ProfileImage } from "@/components/profile-image";
import { PaymentsContainer } from "@/components/appointment/payment-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import db from "@/lib/db";
import { getPatientFullDataById } from "@/utils/services/patient";
import { requireAuthUserId } from "@/lib/auth";
import { format } from "date-fns";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React from "react";
import { AdmissionDetailsSheet } from "@/components/admissions/admission-details-sheet";

interface ParamsProps {
  params: Promise<{ patientId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const PatientProfile = async (props: ParamsProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  let id = params.patientId;
  let patientId = params.patientId;
  const cat = (searchParams?.cat as string) || "medical-history";
  const pageParamRaw = searchParams?.page as string | undefined;
  const pageParam = pageParamRaw ? Number(pageParamRaw) : 1;

  if (patientId === "self") {
    id = await requireAuthUserId();
  } else id = patientId;

  const { data } = await getPatientFullDataById(id);
  if (!data) {
    if (patientId === "self") redirect("/patient/registration");
    notFound();
  }

  const SmallCard = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full md:w-1/3">
      <span className="text-sm text-gray-500">{label}</span>
      <p className="text-sm md:text-base capitalize">{value}</p>
    </div>
  );

  return (
    <div className="bg-gray-100/60 h-full rounded-xl py-6 px-3 2xl:p-6 flex flex-col lg:flex-row gap-6">
      <div className="w-full xl:w-3/4">
        <div className="w-full flex flex-col lg:flex-row gap-4">
          <Card className="bg-white rounded-xl p-4 w-full lg:w-[30%] border-none flex flex-col items-center">
            <ProfileImage
              url={data?.img!}
              name={data?.first_name + " " + data?.last_name}
              className="h-20 w-20 md:flex"
              bgColor={data?.colorCode!}
              textClassName="text-3xl"
            />
            <h1 className="font-semibold text-2xl mt-2">
              {data?.first_name + " " + data?.last_name}
            </h1>
            <span className="text-sm text-gray-500">{data?.email}</span>

            {(data as any)?.isAdmitted ? (
              <div className="mt-3">
                <span className="text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Admitted{(data as any)?.currentAdmission?.wardName ? ` • ${(data as any).currentAdmission.wardName}` : ""}
                </span>
              </div>
            ) : (
              <div className="mt-3">
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  Not admitted
                </span>
              </div>
            )}

            <div className="w-full flex items-center justify-center gap-2 mt-4">
              <div className="w-1/2 space-y-1 text-center">
                <p className="text-xl font-medium">{data?.totalAppointments}</p>
                <span className="text-xs text-gray-500">Appointments</span>
              </div>
          <div className="w-1/2 space-y-1 text-center">
            <p className="text-xs font-medium break-all">{(data as any)?.hospital_number ?? "N/A"}</p>
            <span className="text-xs text-gray-500">Hospital No.</span>
          </div>
            </div>
          </Card>

          <Card className="bg-white rounded-xl p-6 w-full lg:w-[70%] border-none space-y-6">
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center xl:justify-between gap-y-4 md:gap-x-0">
              <SmallCard
                label={"Gender"}
                value={data?.gender?.toLowerCase()!}
              />
              <SmallCard
                label="Date of Birth"
                value={format(data?.date_of_birth!, "yyyy-MM-dd")}
              />
              <SmallCard label={"Phone Number"} value={data?.phone!} />
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center xl:justify-between gap-y-4 md:gap-x-0">
              <SmallCard label="Marital Status" value={data?.marital_status!} />
              <SmallCard label="Blood Group" value={data?.blood_group!} />
              <SmallCard label="Address" value={data?.address!} />
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center xl:justify-between gap-y-4 md:gap-x-0">
              <SmallCard
                label="Contact Person"
                value={data?.emergency_contact_name!}
              />
              <SmallCard
                label="Emergency Contact"
                value={data?.emergency_contact_number!}
              />
              <SmallCard label="Hospital Number" value={(data as any)?.hospital_number ?? "N/A"} />
              <SmallCard
                label="Last Visit"
                value={
                  data?.lastVisit
                    ? format(data?.lastVisit!, "yyyy-MM-dd")
                    : "No last visit"
                }
              />
            </div>
          </Card>
        </div>

        <div className="mt-10">
          {cat === "medical-history" && (
            <MedicalHistoryContainer patientId={id} page={pageParam} />
          )}

          {cat === "payments" && <PaymentsContainer patientId={id} />}
          {cat === "lab-tests" && <PatientLabTestsCard patientId={id} />}
          {cat === "admissions" && <PatientAdmissionsCard patientId={id} />}
        </div>
      </div>

      <div className="w-full xl:w-1/3">
        <div className="bg-white p-4 rounded-md mb-8">
          <h1 className="text-xl font-semibold">Quick Links</h1>

          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-yellow-50 hover:underline"
              href={`/record/appointments?id=${id}`}
            >
              Patient&apos;s Appointments
            </Link>
            <Link
              className="p-3 rounded-md bg-purple-50 hover:underline"
              href="?cat=medical-history"
            >
              Medical Records
            </Link>
            <Link
              className="p-3 rounded-md bg-violet-100"
              href={`?cat=payments`}
            >
              Medical Bills
            </Link>
            <Link className="p-3 rounded-md bg-pink-50" href={`/`}>
              Dashboard
            </Link>

            <Link className="p-3 rounded-md bg-rose-100" href={`?cat=lab-tests`}>
              Lab Test & Result
            </Link>
            <Link className="p-3 rounded-md bg-sky-100" href={`?cat=admissions`}>
              Admissions
            </Link>
            {patientId === "self" && (
              <Link
                className="p-3 rounded-md bg-black/10"
                href={`/patient/registration`}
              >
                Edit Information
              </Link>
            )}
          </div>
        </div>

        <PatientRatingContainer id={id} />
      </div>
    </div>
  );
};

export default PatientProfile;

async function PatientLabTestsCard({ patientId }: { patientId: string }) {
  const tests = await db.labTest.findMany({
    where: { medical_record: { patient_id: patientId } },
    include: { services: { select: { service_name: true } }, medical_record: { select: { appointment_id: true } } },
    orderBy: { created_at: "desc" },
  });

  const appointmentIds = Array.from(new Set(tests.map((t: any) => t.medical_record?.appointment_id).filter(Boolean)));
  const payments = appointmentIds.length
    ? await db.payment.findMany({ where: { appointment_id: { in: appointmentIds } }, select: { appointment_id: true, status: true } })
    : [];
  const payMap = new Map(payments.map((p: any) => [p.appointment_id, p.status]));

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Lab Tests & Results</CardTitle>
        <CardDescription>View and download your lab results.</CardDescription>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <div className="text-sm text-gray-500">No lab tests found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Test</th>
                <th className="py-2 hidden md:table-cell">Date</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t: any) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span>{t.services?.service_name}</span>
                      {(() => {
                        const st = payMap.get(t.medical_record?.appointment_id);
                        const cls = st === "PAID" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : st === "PART" ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-rose-100 text-rose-700 border-rose-200";
                        return (
                          <span title={`Payment: ${st || "UNPAID"}`}
                            className={`text-[10px] px-2 py-0.5 rounded border ${cls}`}>
                            {st || "UNPAID"}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      <span title="Requested at" className="mr-3">Req: {format(t.test_date, "yyyy-MM-dd HH:mm")}</span>
                      <span title="Approved at">Appr: {t.approved_at ? format(t.approved_at, "yyyy-MM-dd HH:mm") : "-"}</span>
                    </div>
                  </td>
                  <td className="py-2 hidden md:table-cell">{format(t.test_date, "yyyy-MM-dd")}</td>
                  <td className="py-2">{t.status}</td>
                  <td className="py-2">
                    {(t.status === "COMPLETED" || t.status === "APPROVED") ? (
                      <a href={`/lab/print/${t.id}`} className="text-blue-600 hover:underline">View / Print</a>
                    ) : (
                      <span className="text-gray-400 italic">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

async function PatientAdmissionsCard({ patientId }: { patientId: string }) {
  const admissions = await db.inpatientAdmission.findMany({
    where: { patient_id: patientId },
    include: {
      ward: { select: { name: true } },
      attending_doctor: { select: { name: true } },
    },
    orderBy: { admitted_at: "desc" },
  });

  const admissionIds = admissions.map((a: any) => a.id);
  const logs = admissionIds.length
    ? await db.auditLog.findMany({
        where: { model: "InpatientAdmission", record_id: { in: admissionIds.map((id: number) => String(id)) } },
        orderBy: { created_at: "asc" },
        select: { id: true, record_id: true, action: true, details: true, created_at: true },
      })
    : [];
  const logsByRecord: Record<string, typeof logs> = logs.reduce((acc: any, l: any) => {
    (acc[l.record_id] ||= []).push(l);
    return acc;
  }, {});

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Admissions History</CardTitle>
        <CardDescription>Past admissions, discharge and attending details.</CardDescription>
      </CardHeader>
      <CardContent>
        {admissions.length === 0 ? (
          <div className="text-sm text-gray-500">No admissions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Ward</th>
                <th className="py-2 hidden md:table-cell">Attending</th>
                <th className="py-2">Admitted</th>
                <th className="py-2 hidden md:table-cell">Discharged</th>
                <th className="py-2">Status</th>
                <th className="py-2 hidden md:table-cell">Discharged By</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((a: any) => (
                <tr key={a.id} className="border-b">
                  <td className="py-2">{a.ward?.name ?? "—"}</td>
                  <td className="py-2 hidden md:table-cell">{a.attending_doctor?.name ?? "—"}</td>
                  <td className="py-2">{a.admitted_at ? format(a.admitted_at, "yyyy-MM-dd") : "—"}</td>
                  <td className="py-2 hidden md:table-cell">{a.discharged_at ? format(a.discharged_at, "yyyy-MM-dd") : "—"}</td>
                  <td className="py-2">{a.status}</td>
                  <td className="py-2 hidden md:table-cell">{a.discharged_by_name ?? "—"}</td>
                  <td className="py-2">
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
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
