"use server";

import { DiagnosisFormData } from "@/components/dialogs/add-diagnosis";
import db from "@/lib/db";
import {
  DiagnosisSchema,
  BillPaymentSchema,
  LabTestRequestSchema,
  LabTestUpdateSchema,
  PatientBillSchema,
  PaymentSchema,
} from "@/lib/schema";
import { checkRole } from "@/utils/roles";
import { requireAuthUserId } from "@/lib/auth";

async function recomputePayment(paymentId: number) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, discount: true },
  });
  if (!payment) return;

  const bills = await db.patientBills.findMany({
    where: { bill_id: paymentId },
    select: { total_cost: true, amount_paid: true },
  });

  const totalAmount = bills.reduce((sum, b) => sum + b.total_cost, 0);
  const amountPaid = bills.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0);
  const payable = Math.max(0, totalAmount - (payment.discount ?? 0));

  const status =
    amountPaid <= 0
      ? "UNPAID"
      : amountPaid >= payable
      ? "PAID"
      : "PART";

  await db.payment.update({
    where: { id: paymentId },
    data: {
      total_amount: totalAmount,
      amount_paid: amountPaid,
      status,
      payment_date: status === "PAID" ? new Date() : undefined,
    },
  });
}

export const addDiagnosis = async (
  data: DiagnosisFormData,
  appointmentId: string
) => {
  try {
    await requireAuthUserId();
    const isAllowed =
      (await checkRole("ADMIN")) ||
      (await checkRole("DOCTOR")) ||
      (await checkRole("NURSE"));
    if (!isAllowed) {
      return { success: false, error: "Unauthorized", status: 403 };
    }

    const validatedData = DiagnosisSchema.parse(data);

    let medicalRecord = null;

    if (!validatedData.medical_id) {
      medicalRecord = await db.medicalRecords.create({
        data: {
          patient_id: validatedData.patient_id,
          doctor_id: validatedData.doctor_id,
          appointment_id: Number(appointmentId),
        },
      });
    }

    const med_id = validatedData.medical_id || medicalRecord?.id;
    await db.diagnosis.create({
      data: {
        ...validatedData,
        medical_id: Number(med_id),
      },
    });

    return {
      success: true,
      message: "Diagnosis added successfully",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "Failed to add diagnosis",
    };
  }
};

export async function requestLabTest(data: any) {
  try {
    await requireAuthUserId();
    const isAllowed =
      (await checkRole("ADMIN")) ||
      (await checkRole("DOCTOR")) ||
      (await checkRole("NURSE")) ||
      (await checkRole("LAB_SCIENTIST")) ||
      (await checkRole("LAB_TECHNICIAN"));
    if (!isAllowed) {
      return { success: false, message: "Unauthorized", status: 403 };
    }

    const validated = LabTestRequestSchema.parse(data);
    const appointmentId = Number(validated.appointment_id);

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, patient_id: true, doctor_id: true },
    });
    if (!appointment) {
      return { success: false, message: "Appointment not found", status: 404 };
    }

    const medical =
      (await db.medicalRecords.findFirst({
        where: { appointment_id: appointmentId },
        select: { id: true },
        orderBy: { created_at: "desc" },
      })) ??
      (await db.medicalRecords.create({
        data: {
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
        },
        select: { id: true },
      }));

    await db.labTest.create({
      data: {
        record_id: medical.id,
        service_id: Number(validated.service_id),
        test_date: new Date(),
        status: "REQUESTED",
        result: "PENDING",
        notes: validated.notes ?? "",
      },
    });

    const service = await db.services.findUnique({
      where: { id: Number(validated.service_id) },
      select: { id: true, price: true, category: true },
    });
    if (service?.category === "LAB_TEST") {
      const existingPayment = await db.payment.findFirst({
        where: { appointment_id: appointmentId },
        select: { id: true },
      });

      const payment =
        existingPayment ??
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

      const alreadyAdded = await db.patientBills.findFirst({
        where: { bill_id: payment.id, service_id: service.id },
        select: { id: true },
      });

      if (!alreadyAdded) {
        await db.patientBills.create({
          data: {
            bill_id: payment.id,
            service_id: service.id,
            service_date: new Date(),
            quantity: 1,
            unit_cost: service.price,
            total_cost: service.price,
          },
        });
      }

      await recomputePayment(payment.id);
    }

    return { success: true, message: "Lab test requested", status: 201 };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message ?? "Failed to request lab test",
      status: 500,
    };
  }
}

export async function updateLabTestResult(data: any) {
  try {
    await requireAuthUserId();
    const isAllowed = await checkRole("LAB_SCIENTIST");
    if (!isAllowed) {
      return { success: false, message: "Unauthorized", status: 403 };
    }

    const validated = LabTestUpdateSchema.parse(data);

    await db.labTest.update({
      where: { id: Number(validated.id) },
      data: {
        status: validated.status,
        result: validated.result,
        notes: validated.notes ?? "",
        updated_at: new Date(),
      },
    });

    return { success: true, message: "Lab test updated", status: 200 };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message ?? "Failed to update lab test",
      status: 500,
    };
  }
}

export async function addNewBill(data: any) {
  try {
    const userId = await requireAuthUserId();

    const isAllowed =
      (await checkRole("ADMIN")) ||
      (await checkRole("DOCTOR")) ||
      (await checkRole("NURSE")) ||
      (await checkRole("LAB_SCIENTIST")) ||
      (await checkRole("LAB_TECHNICIAN")) ||
      (await checkRole("PHARMACIST"));

    if (!isAllowed) {
      return {
        success: false,
        msg: "You are not authorized to add a bill",
      };
    }

    const isValidData = PatientBillSchema.safeParse(data);

    const validatedData = isValidData.data;
    let bill_info = null;

    const service = await db.services.findUnique({
      where: { id: Number(validatedData?.service_id) },
      select: { id: true, category: true },
    });
    if (!service) {
      return { success: false, msg: "Service not found" };
    }

    const canAddGeneral =
      (await checkRole("ADMIN")) ||
      (await checkRole("DOCTOR")) ||
      (await checkRole("NURSE"));
    const canAddLab =
      (await checkRole("ADMIN")) ||
      (await checkRole("LAB_SCIENTIST")) ||
      (await checkRole("LAB_TECHNICIAN"));
    const canAddMeds =
      (await checkRole("ADMIN")) || (await checkRole("PHARMACIST"));

    if (
      (service.category === "GENERAL" && !canAddGeneral) ||
      (service.category === "LAB_TEST" && !canAddLab) ||
      (service.category === "MEDICATION" && !canAddMeds)
    ) {
      return { success: false, msg: "You are not authorized for this service" };
    }

    if (!data?.bill_id || data?.bill_id === "undefined") {
      const info = await db.appointment.findUnique({
        where: { id: Number(data?.appointment_id)! },
        select: {
          id: true,
          patient_id: true,
          bills: {
            where: {
              appointment_id: Number(data?.appointment_id),
            },
          },
        },
      });

      if (!info?.bills?.length) {
        bill_info = await db.payment.create({
          data: {
            appointment_id: Number(data?.appointment_id),
            patient_id: info?.patient_id!,
            bill_date: new Date(),
            payment_date: new Date(),
            discount: 0.0,
            amount_paid: 0.0,
            total_amount: 0.0,
          },
        });
      } else {
        bill_info = info?.bills[0];
      }
    } else {
      bill_info = {
        id: data?.bill_id,
      };
    }

    const createdBill = await db.patientBills.create({
      data: {
        bill_id: Number(bill_info?.id),
        service_id: Number(validatedData?.service_id),
        service_date: new Date(validatedData?.service_date!),
        quantity: Number(validatedData?.quantity),
        unit_cost: Number(validatedData?.unit_cost),
        total_cost: Number(validatedData?.total_cost),
      },
    });

    await recomputePayment(Number(bill_info?.id));
    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(createdBill.id),
        action: "CREATE",
        model: "PatientBills",
        details: `appointment_id=${data?.appointment_id} service_id=${validatedData?.service_id}`,
      },
    });

    return {
      success: true,
      error: false,
      msg: `Bill added successfully`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function generateBill(data: any) {
  try {
    await requireAuthUserId();
    const isValidData = PaymentSchema.safeParse(data);

    const validatedData = isValidData.data;

    const bills = await db.patientBills.findMany({
      where: { bill_id: Number(validatedData?.id) },
      select: { total_cost: true },
    });
    const totalAmount = bills.reduce((sum, b) => sum + b.total_cost, 0);
    const discountAmount = (Number(validatedData?.discount) / 100) * totalAmount;

    const res = await db.payment.update({
      data: {
        bill_date: validatedData?.bill_date,
        discount: discountAmount,
        total_amount: totalAmount,
      },
      where: { id: Number(validatedData?.id) },
    });

    await recomputePayment(res.id);

    await db.appointment.update({
      data: {
        status: "COMPLETED",
      },
      where: { id: res.appointment_id },
    });
    return {
      success: true,
      error: false,
      msg: `Bill generated successfully`,
    };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}

export async function markPatientBillPaid(data: any) {
  try {
    const userId = await requireAuthUserId();
    const isAllowed = (await checkRole("ADMIN")) || (await checkRole("CASHIER"));
    if (!isAllowed) {
      return { success: false, msg: "Unauthorized" };
    }

    const validated = BillPaymentSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, msg: "Invalid payment data" };
    }

    const billId = Number(validated.data.patient_bill_id);
    const amountPaid = Number(validated.data.amount_paid);

    const bill = await db.patientBills.findUnique({
      where: { id: billId },
      select: { id: true, total_cost: true, bill_id: true },
    });
    if (!bill) return { success: false, msg: "Bill not found" };

    const status =
      amountPaid <= 0
        ? "UNPAID"
        : amountPaid >= bill.total_cost
        ? "PAID"
        : "PART";

    await db.patientBills.update({
      where: { id: billId },
      data: {
        amount_paid: amountPaid,
        payment_status: status,
        paid_at: status === "PAID" ? new Date() : null,
        notes: validated.data.coverage_notes ?? undefined,
      },
    });

    await recomputePayment(bill.bill_id);
    await db.payment.update({
      where: { id: bill.bill_id },
      data: {
        coverage_type: (validated.data.coverage_type as any) ?? undefined,
        coverage_notes: validated.data.coverage_notes ?? undefined,
        coverage_reference: validated.data.coverage_reference ?? undefined,
        payment_reason: validated.data.payment_reason ?? undefined,
        payment_method: (validated.data.payment_method as any) ?? undefined,
      },
    });
    await db.auditLog.create({
      data: {
        user_id: userId,
        record_id: String(billId),
        action: "UPDATE",
        model: "PatientBills",
        details: `amount_paid=${amountPaid} status=${status} coverage=${validated.data.coverage_type ?? "NONE"}`,
      },
    });

    return { success: true, msg: "Payment updated" };
  } catch (error) {
    console.log(error);
    return { success: false, msg: "Internal Server Error" };
  }
}
