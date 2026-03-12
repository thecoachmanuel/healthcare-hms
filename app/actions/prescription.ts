"use server";

import db from "@/lib/db";
import { CreatePrescriptionSchema, MedicationAdministrationSchema } from "@/lib/schema";
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

    const payment =
      (await db.payment.findFirst({
        where: { appointment_id: appointmentId },
        select: { id: true },
      })) ??
      (await db.payment.create({
        data: {
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          bill_date: new Date(),
          payment_date: new Date(),
          discount: 0.0,
          amount_paid: 0.0,
          total_amount: 0.0,
        },
        select: { id: true },
      }));

    const meds = await db.services.findMany({
      where: { id: { in: medicationIds } },
      select: { id: true, price: true },
    });
    const priceById = new Map(meds.map((m) => [m.id, m.price]));
    for (const item of validated.data.items) {
      const mid = Number(item.medication_id);
      const qty = Number(item.quantity);
      const unit = priceById.get(mid) ?? 0;
      await db.patientBills.create({
        data: {
          bill_id: payment.id,
          service_id: mid,
          service_date: new Date(),
          quantity: qty,
          unit_cost: unit,
          total_cost: unit * qty,
          notes: `Prescription item`,
        },
      });
    }
    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(prescription.id),
        action: "CREATE",
        model: "PatientBills",
        details: "Added prescription items to bill",
      },
    });
    // recompute totals
    await db.payment.update({
      where: { id: payment.id },
      data: {
        total_amount: (
          await db.patientBills.aggregate({
            where: { bill_id: payment.id },
            _sum: { total_cost: true },
          })
        )._sum.total_cost ?? 0,
      },
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

    await db.notification.createMany({
      data: [
        {
          user_id: appointment.patient_id,
          title: "New Prescription",
          body: "A new prescription has been issued for your appointment.",
        },
      ],
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

export async function recordMedicationAdministration(data: any) {
  try {
    const userId = await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN");
    const isNurse = await checkRole("NURSE");
    if (!isAdmin && !isNurse) {
      return { success: false, msg: "Unauthorized" };
    }

    const validated = MedicationAdministrationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, msg: "Invalid administration data" };
    }

    const prescriptionItemId = Number(validated.data.prescription_item_id);
    const quantity = Number(validated.data.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { success: false, msg: "Quantity must be greater than 0" };
    }

    const item = await db.prescriptionItem.findUnique({
      where: { id: prescriptionItemId },
      include: { prescription: { select: { id: true, patient_id: true, status: true } } },
    });
    if (!item) return { success: false, msg: "Prescription item not found" };

    if (!isAdmin && item.prescription.status !== "DISPENSED") {
      return { success: false, msg: "Prescription must be dispensed before administration" };
    }

    if (item.prescription.patient_id !== validated.data.patient_id) {
      return { success: false, msg: "Unauthorized" };
    }

    const already = await db.medicationAdministration.aggregate({
      where: {
        prescription_item_id: item.id,
        patient_id: item.prescription.patient_id,
      },
      _sum: { quantity: true },
    });
    const administeredQty = already._sum.quantity ?? 0;
    const remaining = item.quantity - administeredQty;
    if (remaining <= 0) {
      return { success: false, msg: "No remaining quantity to administer" };
    }
    if (quantity > remaining) {
      return { success: false, msg: `Quantity exceeds remaining (${remaining})` };
    }

    const created = await db.medicationAdministration.create({
      data: {
        prescription_item_id: item.id,
        patient_id: item.prescription.patient_id,
        nurse_id: userId,
        quantity,
        notes: validated.data.notes?.trim() || null,
        administered_at: new Date(),
      },
      select: { id: true },
    });

    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(created.id),
        action: "CREATE",
        model: "MedicationAdministration",
        details: `prescription_item_id=${item.id} quantity=${quantity}`,
      },
    });

    return { success: true, msg: "Medication administration recorded" };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
