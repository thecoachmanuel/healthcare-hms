"use server";

import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import { getDoctorAvailableTimes } from "@/app/actions/appointment";

const DEMO_PATIENT_EMAIL = "patient1@lasuth.org.ng";

export async function demoBookAppointmentAndCreateBill() {
  const userId = await requireAuthUserId();
  const canBook = (await checkRole("RECEPTIONIST")) || (await checkRole("ADMIN"));
  if (!canBook) return { success: false, message: "Unauthorized" };

  const patient = await db.patient.findUnique({ where: { email: DEMO_PATIENT_EMAIL }, select: { id: true } });
  if (!patient) return { success: false, message: "Demo patient not found" };

  const doctor = await db.doctor.findFirst({ orderBy: { created_at: "asc" }, select: { id: true, department: true } });
  if (!doctor) return { success: false, message: "No doctor found" };

  // Find next available slot today or next day
  let date = new Date();
  let dateISO = date.toISOString().slice(0, 10);
  let times = await getDoctorAvailableTimes(doctor.id, dateISO);
  if (times.length === 0) {
    const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
    dateISO = next.toISOString().slice(0, 10);
    times = await getDoctorAvailableTimes(doctor.id, dateISO);
    date = next;
  }
  if (times.length === 0) return { success: false, message: "No available times" };
  const time = times[0].value;

  const appt = await db.appointment.create({
    data: {
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_date: new Date(dateISO),
      time,
      type: "General Consultation",
      status: "SCHEDULED",
      reason: "Demo flow",
    },
  });

  const consult = await db.services.findFirst({ where: { service_name: { equals: "Consultation", mode: "insensitive" } } });
  if (consult) {
    const payment = await db.payment.create({
      data: {
        appointment_id: appt.id,
        patient_id: patient.id,
        bill_date: new Date(),
        payment_date: new Date(),
        discount: 0,
        total_amount: consult.price,
        amount_paid: 0,
        payment_method: "CASH",
        status: "UNPAID",
      },
    });
    await db.patientBills.create({
      data: {
        bill_id: payment.id,
        service_id: consult.id,
        service_date: new Date(),
        quantity: 1,
        unit_cost: consult.price,
        total_cost: consult.price,
        payment_status: "UNPAID",
        amount_paid: 0,
        notes: "Demo bill",
      },
    });
  }

  return { success: true, message: "Appointment booked and bill created", appointmentId: appt.id };
}

export async function demoCompleteLatestBill() {
  const userId = await requireAuthUserId();
  const canPay = (await checkRole("CASHIER")) || (await checkRole("ADMIN"));
  if (!canPay) return { success: false, message: "Unauthorized" };

  const patient = await db.patient.findUnique({ where: { email: DEMO_PATIENT_EMAIL }, select: { id: true } });
  if (!patient) return { success: false, message: "Demo patient not found" };

  const payment = await db.payment.findFirst({
    where: { patient_id: patient.id, status: { in: ["UNPAID", "PART"] } },
    orderBy: { created_at: "desc" },
    include: { bills: true },
  });
  if (!payment) return { success: false, message: "No pending payments" };

  const total = payment.total_amount;
  await db.payment.update({ where: { id: payment.id }, data: { amount_paid: total, status: "PAID", payment_date: new Date() } });
  await db.patientBills.updateMany({ where: { bill_id: payment.id }, data: { payment_status: "PAID", amount_paid: total, paid_at: new Date() } });

  return { success: true, message: "Payment completed", paymentId: payment.id };
}

