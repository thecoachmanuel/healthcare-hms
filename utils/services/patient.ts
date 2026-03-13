import db from "@/lib/db";
import { getMonth, format, startOfYear, endOfMonth, isToday } from "date-fns";
import { daysOfWeek } from "..";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface Appointment {
  status: AppointmentStatus;
  appointment_date: Date;
}

function isValidStatus(status: string): status is AppointmentStatus {
  return ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"].includes(status);
}

const initializeMonthlyData = () => {
  const this_year = new Date().getFullYear();

  const months = Array.from(
    { length: getMonth(new Date()) + 1 },
    (_, index) => ({
      name: format(new Date(this_year, index), "MMM"),
      appointment: 0,
      completed: 0,
    })
  );
  return months;
};

export const processAppointments = async (appointments: Appointment[]) => {
  const monthlyData = initializeMonthlyData();

  const appointmentCounts = appointments.reduce<
    Record<AppointmentStatus, number>
  >(
    (acc, appointment) => {
      const status = appointment.status;

      const appointmentDate = appointment?.appointment_date;

      const monthIndex = getMonth(appointmentDate);

      if (
        appointmentDate >= startOfYear(new Date()) &&
        appointmentDate <= endOfMonth(new Date())
      ) {
        monthlyData[monthIndex].appointment += 1;

        if (status === "COMPLETED") {
          monthlyData[monthIndex].completed += 1;
        }
      }

      // Grouping by status
      if (isValidStatus(status)) {
        acc[status] = (acc[status] || 0) + 1;
      }

      return acc;
    },
    {
      PENDING: 0,
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }
  );

  return { appointmentCounts, monthlyData };
};

export async function getPatientDashboardStatistics(id: string) {
  try {
    if (!id) {
      return {
        success: false,
        message: "No data found",
        data: null,
      };
    }

    const data = await db.patient.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        gender: true,
        img: true,
        colorCode: true,
      },
    });

    if (!data) {
      return {
        success: false,
        message: "Patient data not found",
        status: 200,
        data: null,
      };
    }

    const appointments = await db.appointment.findMany({
      where: { patient_id: data?.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            img: true,
            specialization: true,
            colorCode: true,
          },
        },
        patient: {
          select: {
            first_name: true,
            last_name: true,
            gender: true,
            date_of_birth: true,
            img: true,
            colorCode: true,
          },
        },
      },

      orderBy: { appointment_date: "desc" },
    });

    const { appointmentCounts, monthlyData } = await processAppointments(
      appointments
    );
    const last5Records = appointments.slice(0, 5);

    const today = daysOfWeek[new Date().getDay()];

    const availableDoctor = await db.doctor.findMany({
      select: {
        id: true,
        name: true,
        specialization: true,
        img: true,
        working_days: true,
        colorCode: true,
      },
      where: {
        working_days: {
          some: {
            day: {
              equals: today,
              mode: "insensitive",
            },
          },
        },
      },
      take: 4,
    });

    return {
      success: true,
      data,
      appointmentCounts,
      last5Records,
      totalAppointments: appointments.length,
      availableDoctor,
      monthlyData,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getPatientById(id: string) {
  try {
    const patient = await db.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return {
        success: false,
        message: "Patient data not found",
        status: 200,
        data: null,
      };
    }

    return { success: true, data: patient, status: 200 };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getPatientFullDataById(id: string) {
  try {
    const patient = await db.patient.findFirst({
      where: {
        OR: [
          {
            id,
          },
          { email: id },
        ],
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
        appointments: {
          select: {
            appointment_date: true,
          },
          orderBy: {
            appointment_date: "desc",
          },
          take: 1,
        },
      },
    });

    if (!patient) {
      return {
        success: false,
        message: "Patient data not found",
        status: 404,
      };
    }
    const lastVisit = patient.appointments[0]?.appointment_date || null;

    const currentAdmission = await (async () => {
      try {
        const admission = await db.inpatientAdmission.findFirst({
          where: { patient_id: patient.id, status: "ADMITTED" },
          orderBy: { admitted_at: "desc" },
          select: { admitted_at: true, ward: { select: { name: true } } },
        });
        if (!admission) return null;
        return { admittedAt: admission.admitted_at, wardName: admission.ward?.name ?? null };
      } catch {
        return null;
      }
    })();

    return {
      success: true,
      data: {
        ...patient,
        totalAppointments: patient._count.appointments,
        lastVisit,
        currentAdmission,
        isAdmitted: Boolean(currentAdmission),
      },
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getAllPatients({
  page,
  limit,
  search,
  gender,
  hospitalNumber,
  admission,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  gender?: string;
  hospitalNumber?: string;
  admission?: "ADMITTED" | "NOT_ADMITTED";
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const baseAnd = [
      {
        OR: [
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { hospital_number: { contains: search, mode: "insensitive" } },
        ],
      },
      gender ? { gender: gender as any } : {},
      hospitalNumber
        ? { hospital_number: { contains: hospitalNumber, mode: "insensitive" } }
        : {},
    ];

    const admissionFilter =
      admission === "ADMITTED"
        ? ({ admissions: { some: { status: "ADMITTED" } } } as const)
        : admission === "NOT_ADMITTED"
        ? ({ admissions: { none: { status: "ADMITTED" } } } as const)
        : ({} as const);

    const whereWithAdmission = {
      AND: [...baseAnd, admissionFilter],
    } as const;

    const whereWithoutAdmission = {
      AND: baseAnd,
    } as const;

    const fetchPatients = async (useAdmission: boolean) => {
      const where = useAdmission ? (whereWithAdmission as any) : (whereWithoutAdmission as any);
      const [patients, totalRecords] = await Promise.all([
        db.patient.findMany({
          where,
          include: {
            appointments: {
              select: {
                medical: {
                  select: { created_at: true, treatment_plan: true },
                  orderBy: { created_at: "desc" },
                  take: 1,
                },
              },
              orderBy: { appointment_date: "desc" },
              take: 1,
            },
          },
          skip: SKIP,
          take: LIMIT,
          orderBy: { first_name: "asc" },
        }),
        db.patient.count({ where }),
      ]);
      return { patients, totalRecords };
    };

    const { patients, totalRecords } = await (async () => {
      try {
        return await fetchPatients(true);
      } catch {
        return await fetchPatients(false);
      }
    })();

    const currentAdmissions = await (async () => {
      try {
        const ids = patients.map((p) => p.id);
        if (ids.length === 0) return [];
        return await db.inpatientAdmission.findMany({
          where: { status: "ADMITTED", patient_id: { in: ids } },
          select: { patient_id: true, ward: { select: { name: true } }, admitted_at: true },
        });
      } catch {
        return [];
      }
    })();

    const admissionByPatientId = new Map(
      currentAdmissions.map((a: any) => [
        a.patient_id,
        {
          wardName: a.ward?.name ?? null,
          admittedAt: a.admitted_at,
        },
      ])
    );

    const patientsWithAdmission = patients.map((p: any) => {
      const a = admissionByPatientId.get(p.id) ?? null;
      return {
        ...p,
        currentAdmission: a,
        isAdmitted: Boolean(a),
      };
    });

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data: patientsWithAdmission,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
