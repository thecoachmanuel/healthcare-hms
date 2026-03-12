"use server";

import db from "@/lib/db";
import { CreatePrescriptionSchema } from "@/lib/schema";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

export async function createPrescription(data: any) {
  try {
    const userId = await requireAuthUserId();
    const isDoctor = await checkRole("DOCTOR");
    if (!isDoctor) {
      return { success: false, msg: "Unauthorized" };
    }

    const validated = CreatePrescriptionSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, msg: "Invalid prescription data" };
    }

    const appointmentId = Number(validated.data.appointment_id);
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, patient_id: true, doctor_id: true },
    });
    if (!appointment) return { success: false, msg: "Appointment not found" };
    if (appointment.doctor_id !== userId) {
      return { success: false, msg: "Unauthorized" };
    }

    const medicationIds = validated.data.items.map((i) => Number(i.medication_id));
    const medications = await db.services.findMany({
      where: { id: { in: medicationIds }, category: "MEDICATION" },
      select: { id: true },
    });
    if (medications.length !== medicationIds.length) {
      return { success: false, msg: "Invalid medication selection" };
    }

    const prescription = await db.prescription.create({
      data: {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        notes: validated.data.notes ?? "",
        status: "ISSUED",
        items: {
          create: validated.data.items.map((i) => ({
            medication_id: Number(i.medication_id),
            quantity: Number(i.quantity),
            dosage: i.dosage ?? "",
            instructions: i.instructions ?? "",
          })),
        },
      },
      select: { id: true },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(prescription.id),
        action: "CREATE",
        model: "Prescription",
        details: `appointment_id=${appointmentId}`,
      },
    });

    return { success: true, msg: "Prescription created", id: prescription.id };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function markPrescriptionDispensed(id: string) {
  try {
    const userId = await requireAuthUserId();
    const isAllowed = (await checkRole("ADMIN")) || (await checkRole("PHARMACIST"));
    if (!isAllowed) {
      return { success: false, msg: "Unauthorized" };
    }

    await db.prescription.update({
      where: { id: Number(id) },
      data: { status: "DISPENSED" },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(id),
        action: "UPDATE",
        model: "Prescription",
        details: "status=DISPENSED",
      },
    });

    return { success: true, msg: "Prescription marked as dispensed" };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
