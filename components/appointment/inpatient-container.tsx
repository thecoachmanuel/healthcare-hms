import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { AdmitPatient } from "../dialogs/admit-patient";
import { DischargePatient } from "../dialogs/discharge-patient";

export async function InpatientContainer({ patientId }: { patientId: string }) {
  const [admission, wards, doctors, canDischarge] = await Promise.all([
    db.inpatientAdmission.findFirst({
      where: { patient_id: patientId, status: "ADMITTED" },
      select: {
        id: true,
        admitted_at: true,
        discharge_notes: true,
        ward: { select: { id: true, name: true, department: true } },
        attending_doctor: { select: { id: true, name: true } },
      },
      orderBy: { admitted_at: "desc" },
    }),
    db.ward.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.doctor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    (async () => (await checkRole("ADMIN")) || (await checkRole("DOCTOR")))(),
  ]);

  const wardOptions = wards.map((w: any) => ({ label: w.name, value: String(w.id) }));
  const doctorOptions = doctors.map((d: any) => ({ label: d.name, value: d.id }));

  return (
    <div className="border rounded-lg bg-white">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Inpatient Admission</h3>
        <p className="text-sm text-gray-500">Admit or discharge inpatients.</p>
      </div>
      <div className="p-4">
        {!admission ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Patient is not currently admitted.</div>
            <AdmitPatient patientId={patientId} wards={wardOptions} doctors={doctorOptions} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="text-sm">
              <div>
                <span className="font-medium">Ward:</span> {admission.ward?.name ?? "—"}
              </div>
              <div>
                <span className="font-medium">Attending:</span> {admission.attending_doctor?.name ?? "—"}
              </div>
              <div>
                <span className="font-medium">Admitted at:</span> {admission.admitted_at?.toISOString().slice(0, 10)}
              </div>
            </div>
            {canDischarge && <DischargePatient admissionId={admission.id} />}
          </div>
        )}
      </div>
    </div>
  );
}
