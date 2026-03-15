import db from "@/lib/db";
import { daysOfWeek } from "..";
import { processAppointments } from "./patient";

export async function getAdminDashboardStats() {
  try {
    const todayDate = new Date().getDay();
    const today = daysOfWeek[todayDate];

    const [
      totalPatient,
      totalDoctors,
      appointments,
      doctors,
      auditLogs,
      labRequestCount,
      paymentAgg,
      paidCount,
      partCount,
      unpaidCount,
    ] =
      await Promise.all([
        db.patient.count(),
        db.doctor.count(),
        db.appointment.findMany({
          include: {
            patient: {
              select: {
                id: true,
                last_name: true,
                first_name: true,
                img: true,
                colorCode: true,
                gender: true,
                date_of_birth: true,
              },
            },
            doctor: {
              select: {
                name: true,
                img: true,
                colorCode: true,
                specialization: true,
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
          },
          take: 5,
        }),
        db.auditLog.findMany({ orderBy: { created_at: "desc" }, take: 20 }),
        db.labTest.count({}),
        db.payment.aggregate({ _sum: { total_amount: true, amount_paid: true, discount: true } }),
        db.payment.count({ where: { status: "PAID" as any } }),
        db.payment.count({ where: { status: "PART" as any } }),
        db.payment.count({ where: { status: "UNPAID" as any } }),
      ]);

    const { appointmentCounts, monthlyData } = await processAppointments(
      appointments
    );

    const last5Records = appointments.slice(0, 5);

    const totalBilled = Number(paymentAgg._sum.total_amount || 0);
    const totalDiscount = Number((paymentAgg as any)._sum.discount || 0);
    const totalPaid = Number(paymentAgg._sum.amount_paid || 0);
    const totalPayable = Math.max(0, totalBilled - totalDiscount);
    const outstanding = Math.max(0, totalPayable - totalPaid);

    return {
      success: true,
      totalPatient,
      totalDoctors,
      appointmentCounts,
      availableDoctors: doctors,
      monthlyData,
      last5Records,
      totalAppointments: appointments.length,
      auditLogs,
      labRequestCount,
      paymentsSummary: {
        totalBilled,
        totalDiscount,
        totalPayable,
        totalPaid,
        outstanding,
        paidCount,
        partCount,
        unpaidCount,
      },
      status: 200,
    };
  } catch (error) {
    console.log(error);

    return { error: true, message: "Something went wrong" };
  }
}

export async function getServices() {
  try {
    const data = await db.services.findMany({
      orderBy: { service_name: "asc" },
    });

    if (!data) {
      return {
        success: false,
        message: "Data not found",
        status: 404,
        data: [],
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
