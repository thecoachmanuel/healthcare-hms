import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { format } from "date-fns";
import PrintActions from "./print-actions";

interface ParamsProps {
  params: Promise<{ id: string }>;
}

const PrintLabResultPage = async (props: ParamsProps) => {
  const userId = await requireAuthUserId();
  const params = await props.params;
  const id = Number(params.id);

  const [isStaff, isPatient] = await Promise.all([
    (await checkRole("LAB_SCIENTIST")) || (await checkRole("LAB_TECHNICIAN")) || (await checkRole("ADMIN")) || (await checkRole("DOCTOR")) || (await checkRole("NURSE")),
    checkRole("PATIENT"),
  ]);

  const test = await db.labTest.findUnique({
    where: { id },
    include: {
      services: { select: { service_name: true } },
      medical_record: {
        select: {
          patient: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              hospital_number: true,
              gender: true,
            },
          },
          appointment: { select: { id: true, appointment_date: true } },
        },
      },
    },
  });

  if (!test) return null;
  if (!isStaff && !isPatient) return null;
  if (isPatient && test.medical_record.patient.id !== userId) return null;

  const patient = test.medical_record.patient as any;
  const name = `${patient.first_name} ${patient.last_name}`.trim();
  const sampleId = (test as any).sample_id as string | undefined;
  const approvedAt = (test as any).approved_at as Date | undefined;
  const approvedBy = (test as any).approved_by_id as string | undefined;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Laboratory Result</h1>
          <p className="text-sm text-gray-600">{test.services?.service_name}</p>
        </div>
        <PrintActions />
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">Patient Name</div>
            <div className="font-medium">{name}</div>
          </div>
          <div>
            <div className="text-gray-500">Hospital Number</div>
            <div className="font-medium">{patient.hospital_number ?? '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Gender</div>
            <div className="font-medium capitalize">{String(patient.gender || '').toLowerCase()}</div>
          </div>
          <div>
            <div className="text-gray-500">Test Date</div>
            <div className="font-medium">{format(test.test_date, 'yyyy-MM-dd')}</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{test.status}</div>
          </div>
          {sampleId && (
            <div>
              <div className="text-gray-500">Sample ID</div>
              <div className="font-medium">{sampleId}</div>
            </div>
          )}
          {approvedAt && (
            <div>
              <div className="text-gray-500">Approved</div>
              <div className="font-medium">{format(approvedAt, 'yyyy-MM-dd HH:mm')}</div>
            </div>
          )}
          <div>
            <div className="text-gray-500">Appointment</div>
            <div className="font-medium">#{test.medical_record.appointment?.id}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-gray-500 text-sm">Result</div>
          <pre className="whitespace-pre-wrap text-sm border rounded-md p-3">{test.result}</pre>
        </div>

        {test.notes && (
          <div className="mt-4">
            <div className="text-gray-500 text-sm">Notes</div>
            <pre className="whitespace-pre-wrap text-sm border rounded-md p-3">{test.notes}</pre>
          </div>
        )}

        {approvedBy && (
          <div className="mt-2 text-xs text-gray-500">Approved By: {approvedBy}</div>
        )}
      </div>
    </div>
  );
};

export default PrintLabResultPage;
