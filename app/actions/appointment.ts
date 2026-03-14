"use server";

import { VitalSignsFormData } from "@/components/dialogs/add-vital-signs";
import db from "@/lib/db";
import { AppointmentSchema, VitalSignsSchema } from "@/lib/schema";
import { requireAuthUserId } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";
import { daysOfWeek, generateTimes } from "@/utils";

export async function createNewAppointment(data: any) {
  try {
    const validatedData = AppointmentSchema.safeParse(data);

    if (!validatedData.success) {
      return { success: false, msg: "Invalid data" };
    }
    const validated = validatedData.data;

    const apptDate = new Date(validated.appointment_date);
    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await db.doctor.findUnique({
      where: { id: validated.doctor_id },
      select: { working_days: true, department: true },
    });
    if (!doctor) return { success: false, msg: "Doctor not found" };

    const dayName = daysOfWeek[apptDate.getDay()];
    const workingDay = doctor.working_days.find((d: any) => d.day.toLowerCase() === dayName);
    if (!workingDay) return { success: false, msg: "Doctor not available on selected day" };

    const [hourStr] = (workingDay.start_time ?? "09:00").split(":");
    const [endHourStr] = (workingDay.close_time ?? "17:00").split(":");
    const startHour = parseInt(hourStr, 10);
    const endHour = parseInt(endHourStr, 10);
    const allSlots = generateTimes(startHour, endHour, 30).map((t) => t.value);
    if (!allSlots.includes(validated.time)) {
      return { success: false, msg: "Selected time is outside doctor's working hours" };
    }

    const conflict = await db.appointment.findFirst({
      where: {
        doctor_id: validated.doctor_id,
        appointment_date: { gte: startOfDay, lte: endOfDay },
        time: validated.time,
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      select: { id: true },
    });
    if (conflict) return { success: false, msg: "Time already booked" };

    await db.appointment.create({
      data: {
        patient_id: data.patient_id,
        doctor_id: validated.doctor_id,
        time: validated.time,
        type: validated.type,
        appointment_date: apptDate,
        note: validated.note,
      },
    });

    return {
      success: true,
      message: "Appointment booked successfully",
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function getDoctorAvailableTimes(doctorId: string, dateISO: string) {
  try {
    if (!doctorId || !dateISO) return [] as { label: string; value: string }[];
    const date = new Date(dateISO);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await db.doctor.findUnique({ where: { id: doctorId }, select: { working_days: true } });
    if (!doctor) return [];
    const dayName = daysOfWeek[date.getDay()];
    const wd = doctor.working_days.find((d: any) => d.day.toLowerCase() === dayName);
    if (!wd) return [];
    const [h1] = (wd.start_time ?? "09:00").split(":");
    const [h2] = (wd.close_time ?? "17:00").split(":");
    const times = generateTimes(parseInt(h1, 10), parseInt(h2, 10), 30);

    const booked = await db.appointment.findMany({
      where: {
        doctor_id: doctorId,
        appointment_date: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      select: { time: true },
    });
    const bookedSet = new Set(booked.map((b) => b.time));
    return times.filter((t) => !bookedSet.has(t.value));
  } catch {
    return [] as { label: string; value: string }[];
  }
}

export async function getDepartmentDaySchedule(department: string, dateISO: string) {
  try {
    const date = new Date(dateISO);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const dayName = daysOfWeek[date.getDay()];

    const doctors = await db.doctor.findMany({
      where: { department: { contains: department, mode: "insensitive" }, working_days: { some: { day: { equals: dayName, mode: "insensitive" } } } },
      select: { id: true, name: true, working_days: true },
    });

    const schedules = await Promise.all(
      doctors.map(async (doc) => {
        const wd = doc.working_days.find((d: any) => d.day.toLowerCase() === dayName);
        if (!wd) return { doctor: doc, availableTimes: [] as string[] };
        const [h1] = (wd.start_time ?? "09:00").split(":");
        const [h2] = (wd.close_time ?? "17:00").split(":");
        const all = generateTimes(parseInt(h1, 10), parseInt(h2, 10), 30).map((t) => t.value);
        const booked = await db.appointment.findMany({ where: { doctor_id: doc.id, appointment_date: { gte: startOfDay, lte: endOfDay }, status: { in: ["PENDING", "SCHEDULED"] } }, select: { time: true } });
        const bookedSet = new Set(booked.map((b) => b.time));
        const availableTimes = all.filter((t) => !bookedSet.has(t));
        return { doctor: { id: doc.id, name: doc.name }, availableTimes };
      })
    );
    return schedules;
  } catch {
    return [] as { doctor: { id: string; name: string }; availableTimes: string[] }[];
  }
}

export async function generateAppointmentReminders(windowHours = 24) {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
    const upcoming = await db.appointment.findMany({
      where: { appointment_date: { gte: now, lte: windowEnd }, status: { in: ["PENDING", "SCHEDULED"] } },
      select: { id: true, patient_id: true, doctor_id: true, appointment_date: true, time: true, type: true },
    });

    for (const a of upcoming) {
      const dateStr = a.appointment_date.toISOString().slice(0, 10);
      const title = `Upcoming appointment`;
      const body = `${dateStr} at ${a.time} — ${a.type ?? "Consultation"}`;
      const existingPatient = await db.notification.findFirst({ where: { user_id: a.patient_id, title, body } });
      if (!existingPatient) {
        await db.notification.create({ data: { user_id: a.patient_id, title, body } });
      }
      const existingDoctor = await db.notification.findFirst({ where: { user_id: a.doctor_id, title, body } });
      if (!existingDoctor) {
        await db.notification.create({ data: { user_id: a.doctor_id, title, body } });
      }
    }
    return { success: true, count: upcoming.length };
  } catch (e) {
    console.log(e);
    return { success: false, msg: "Failed to generate reminders" };
  }
}

export async function getDoctorDaySlots(doctorId: string, dateISO: string) {
  try {
    if (!doctorId || !dateISO) return { all: [] as string[], booked: [] as string[] };
    const date = new Date(dateISO);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const dayName = daysOfWeek[date.getDay()];
    const doctor = await db.doctor.findUnique({ where: { id: doctorId }, select: { working_days: true } });
    if (!doctor) return { all: [], booked: [] };
    const wd = doctor.working_days.find((d: any) => d.day.toLowerCase() === dayName);
    if (!wd) return { all: [], booked: [] };
    const [h1] = (wd.start_time ?? "09:00").split(":");
    const [h2] = (wd.close_time ?? "17:00").split(":");
    const all = generateTimes(parseInt(h1, 10), parseInt(h2, 10), 30).map((t) => t.value);
    const bookedRecords = await db.appointment.findMany({ where: { doctor_id: doctorId, appointment_date: { gte: startOfDay, lte: endOfDay }, status: { in: ["PENDING", "SCHEDULED"] } }, select: { time: true } });
    const booked = bookedRecords.map((b) => b.time);
    return { all, booked };
  } catch {
    return { all: [] as string[], booked: [] as string[] };
  }
}

export async function getDepartmentDaySlots(department: string, dateISO: string) {
  try {
    const date = new Date(dateISO);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const dayName = daysOfWeek[date.getDay()];
    const doctors = await db.doctor.findMany({
      where: { department: { contains: department, mode: "insensitive" }, working_days: { some: { day: { equals: dayName, mode: "insensitive" } } } },
      select: { id: true, name: true, working_days: true },
    });
    const result = await Promise.all(
      doctors.map(async (doc) => {
        const wd = doc.working_days.find((d: any) => d.day.toLowerCase() === dayName);
        if (!wd) return { doctor: { id: doc.id, name: doc.name }, all: [] as string[], booked: [] as string[] };
        const [h1] = (wd.start_time ?? "09:00").split(":");
        const [h2] = (wd.close_time ?? "17:00").split(":");
        const all = generateTimes(parseInt(h1, 10), parseInt(h2, 10), 30).map((t) => t.value);
        const bookedRecords = await db.appointment.findMany({ where: { doctor_id: doc.id, appointment_date: { gte: startOfDay, lte: endOfDay }, status: { in: ["PENDING", "SCHEDULED"] } }, select: { time: true } });
        const booked = bookedRecords.map((b) => b.time);
        return { doctor: { id: doc.id, name: doc.name }, all, booked };
      })
    );
    return result;
  } catch {
    return [] as { doctor: { id: string; name: string }; all: string[]; booked: string[] }[];
  }
}
export async function appointmentAction(
  id: string | number,

  status: AppointmentStatus,
  reason: string
) {
  try {
    await db.appointment.update({
      where: { id: Number(id) },
      data: {
        status,
        reason,
      },
    });

    return {
      success: true,
      error: false,
      msg: `Appointment ${status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function addVitalSigns(
  data: VitalSignsFormData,
  appointmentId: string,
  doctorId: string
) {
  try {
    await requireAuthUserId();

    const validatedData = VitalSignsSchema.parse(data);

    let medicalRecord = null;

    if (!validatedData.medical_id) {
      medicalRecord = await db.medicalRecords.create({
        data: {
          patient_id: validatedData.patient_id,
          appointment_id: Number(appointmentId),
          doctor_id: doctorId,
        },
      });
    }

    const med_id = validatedData.medical_id || medicalRecord?.id;

    await db.vitalSigns.create({
      data: {
        ...validatedData,
        medical_id: Number(med_id!),
      },
    });

    return {
      success: true,
      msg: "Vital signs added successfully",
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
