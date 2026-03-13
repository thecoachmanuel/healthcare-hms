import { AppointmentDetails } from "@/components/appointment/appointment-details";
import AppointmentQuickLinks from "@/components/appointment/appointment-quick-links";
import { BillsContainer } from "@/components/appointment/bills-container";
import ChartContainer from "@/components/appointment/chart-container";
import { DiagnosisContainer } from "@/components/appointment/diagnosis-container";
import { PatientDetailsCard } from "@/components/appointment/patient-details-card";
import { PaymentsContainer } from "@/components/appointment/payment-container";
import { VitalSigns } from "@/components/appointment/vital-signs";
import { LabTestContainer } from "@/components/appointment/lab-test-container";
import { MedicalHistoryContainer } from "@/components/medical-history-container";
import { PrescriptionContainer } from "@/components/appointment/prescription-container";
import { getAppointmentWithMedicalRecordsById } from "@/utils/services/appointment";
import db from "@/lib/db";
import { InpatientContainer } from "@/components/appointment/inpatient-container";

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
  const prescriptionCount = await db.prescription.count({
    where: { appointment_id: Number(id) },
  });

  return (
    <div className="flex p-6 flex-col-reverse lg:flex-row w-full min-h-screen gap-10">
      {/* LEFT */}
      <div className="w-full lg:w-[65%] flex flex-col gap-6">
        {data?.status === "COMPLETED" && prescriptionCount === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-md">
            Appointment completed. Please create a prescription for the patient.
          </div>
        )}
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
        {cat === "lab-test" && <LabTestContainer appointmentId={id} />}
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
        {cat === "bills" && <BillsContainer id={id} />}
        {cat === "payments" && (
          <PaymentsContainer patientId={data?.patient_id!} />
        )}
        {cat === "prescriptions" && (
          <PrescriptionContainer appointmentId={id} patientId={data?.patient_id!} />
        )}
        <InpatientContainer patientId={data?.patient_id!} />
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
