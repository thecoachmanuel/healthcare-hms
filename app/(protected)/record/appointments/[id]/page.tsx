import { AppointmentDetails } from "@/components/appointment/appointment-details";
import AppointmentQuickLinks from "@/components/appointment/appointment-quick-links";
import { BillsContainer } from "@/components/appointment/bills-container";
import ChartContainer from "@/components/appointment/chart-container";
import { DiagnosisContainer } from "@/components/appointment/diagnosis-container";
import { PatientDetailsCard } from "@/components/appointment/patient-details-card";
import { PaymentsContainer } from "@/components/appointment/payment-container";
import { VitalSigns } from "@/components/appointment/vital-signs";
import { MedicalHistoryContainer } from "@/components/medical-history-container";
import { getAppointmentWithMedicalRecordsById } from "@/utils/services/appointment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AppointmentDetailsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { id } = await params;
  const search = await searchParams;
  const cat = (search?.cat as string) || "charts";

  const { data } = await getAppointmentWithMedicalRecordsById(Number(id));

  return (
    <div className="flex p-6 flex-col-reverse lg:flex-row w-full min-h-screen gap-10">
      {/* LEFT */}
      <div className="w-full lg:w-[65%] flex flex-col gap-6">
        {cat === "charts" && <ChartContainer id={data?.patient_id!} />}
        {cat === "appointments" && (
          <>
            <AppointmentDetails
              id={data?.id!}
              patient_id={data?.patient_id!}
              appointment_date={data?.appointment_date!}
              time={data?.time!}
              notes={data?.note!}
            />

            <VitalSigns
              id={id}
              patientId={data?.patient_id!}
              doctorId={data?.doctor_id!}
            />
          </>
        )}
        {cat === "lab-test" && (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Lab Test</CardTitle>
              <CardDescription>Manage lab requests and results for this appointment.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">Coming soon.</CardContent>
          </Card>
        )}
        {cat === "diagnosis" && (
          <DiagnosisContainer
            id={id}
            patientId={data?.patient_id!}
            doctorId={data?.doctor_id!}
          />
        )}
        {cat === "medical-history" && (
          <MedicalHistoryContainer id={id!} patientId={data?.patient_id!} />
        )}
        {cat === "billing" && <BillsContainer id={id} />}
        {cat === "payments" && (
          <PaymentsContainer patientId={data?.patient_id!} />
        )}
      </div>
      {/* RIGHT */}
      <div className="flex-1 space-y-6">
        <AppointmentQuickLinks staffId={data?.doctor_id as string} />
        <PatientDetailsCard patient={data?.patient!} physician={data?.doctor} />
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;
