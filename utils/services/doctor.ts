import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { daysOfWeek } from "..";
import { processAppointments } from "./patient";

export async function getDoctors() {
  try {
    const data = await db.doctor.findMany();

    return { success: true, data, status: 200 };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
export async function getDoctorDashboardStats() {
  try {
    const userId = await requireAuthUserId();

    const todayDate = new Date().getDay();
    const today = daysOfWeek[todayDate];

    const [totalPatient, totalNurses, appointments, doctors] =
      await Promise.all([
        db.patient.count(),
        db.staff.count({ where: { role: "NURSE" } }),
        db.appointment.findMany({
          where: { doctor_id: userId!, appointment_date: { lte: new Date() } },
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                gender: true,
                date_of_birth: true,
                colorCode: true,
                img: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                img: true,
                colorCode: true,
              },
            },
          },
          orderBy: { appointment_date: "desc" },
        }),
        db.doctor.findMany({
          where: {
            working_days: {
              some: { day: { equals: today, mode: "insensitive" } },
            },
          },
          select: {
            id: true,
            name: true,
            specialization: true,
            img: true,
            colorCode: true,
            working_days: true,
          },
          take: 5,
        }),
      ]);

    const { appointmentCounts, monthlyData } = await processAppointments(
      appointments
    );

    const last5Records = appointments.slice(0, 5);
    // const availableDoctors = doctors.slice(0, 5);

    return {
      totalNurses,
      totalPatient,
      appointmentCounts,
      last5Records,
      availableDoctors: doctors,
      totalAppointment: appointments?.length,
      monthlyData,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getDoctorById(id: string) {
  try {
    const [doctor, totalAppointment] = await Promise.all([
      db.doctor.findUnique({
        where: { id },
        include: {
          working_days: true,
          appointments: {
            include: {
              patient: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  gender: true,
                  img: true,
                  colorCode: true,
                },
              },
              doctor: {
                select: {
                  name: true,
                  specialization: true,
                  img: true,
                  colorCode: true,
                },
              },
            },
            orderBy: { appointment_date: "desc" },
            take: 10,
          },
        },
      }),
      db.appointment.count({
        where: { doctor_id: id },
      }),
    ]);

    return { data: doctor, totalAppointment };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getRatingById(id: string) {
  try {
    const data = await db.rating.findMany({
      where: { staff_id: id },
      include: {
        patient: { select: { last_name: true, first_name: true } },
      },
    });

    const totalRatings = data?.length;
    const sumRatings = data?.reduce((sum, el) => sum + el.rating, 0);

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    const formattedRatings = (Math.round(averageRating * 10) / 10).toFixed(1);

    return {
      totalRatings,
      averageRating: formattedRatings,
      ratings: data,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getAllDoctors({
  page,
  limit,
  search,
  specialization,
  department,
  type,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  specialization?: string;
  department?: string;
  type?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const q = (search ?? "").trim();
    const spec = (specialization ?? "").trim();
    const dept = (department ?? "").trim();
    const jobType = (type ?? "").trim();

    const where: any = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { specialization: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { license_number: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        spec ? { specialization: { equals: spec, mode: "insensitive" } } : {},
        dept ? { department: { contains: dept, mode: "insensitive" } } : {},
        jobType ? { type: jobType as any } : {},
      ],
    };

    const [doctors, totalRecords, typeCounts, specializationCounts] = await Promise.all([
      db.doctor.findMany({
        where,
        include: { working_days: true },
        skip: SKIP,
        take: LIMIT,
      }),
      db.doctor.count({ where }),
      (db as any).doctor.groupBy({
        by: ["type"],
        _count: { _all: true },
        where,
      }),
      (db as any).doctor.groupBy({
        by: ["specialization"],
        _count: { _all: true },
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data: doctors,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      stats: {
        typeCounts: (typeCounts ?? []).map((r: any) => ({
          type: String(r.type),
          count: Number(r._count?._all ?? 0),
        })),
        specializationCounts: (specializationCounts ?? []).map((r: any) => ({
          specialization: String(r.specialization),
          count: Number(r._count?._all ?? 0),
        })),
      },
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
