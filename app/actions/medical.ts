"use server";

import { DiagnosisFormData } from "@/components/dialogs/add-diagnosis";
import db from "@/lib/db";
import {
  DiagnosisSchema,
  LabTestRequestSchema,
  LabTestUpdateSchema,
  PatientBillSchema,
  PaymentSchema,
} from "@/lib/schema";
import { checkRole } from "@/utils/roles";
import { requireAuthUserId } from "@/lib/auth";

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
      (await checkRole("NURSE"));
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
    const isAdmin = await checkRole("ADMIN");
    const isDoctor = await checkRole("DOCTOR");

    if (!isAdmin && !isDoctor) {
      return {
        success: false,
        msg: "You are not authorized to add a bill",
      };
    }

    const isValidData = PatientBillSchema.safeParse(data);

    const validatedData = isValidData.data;
    let bill_info = null;

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

    await db.patientBills.create({
      data: {
        bill_id: Number(bill_info?.id),
        service_id: Number(validatedData?.service_id),
        service_date: new Date(validatedData?.service_date!),
        quantity: Number(validatedData?.quantity),
        unit_cost: Number(validatedData?.unit_cost),
        total_cost: Number(validatedData?.total_cost),
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
    const isValidData = PaymentSchema.safeParse(data);

    const validatedData = isValidData.data;

    const discountAmount =
      (Number(validatedData?.discount) / 100) *
      Number(validatedData?.total_amount);

    const res = await db.payment.update({
      data: {
        bill_date: validatedData?.bill_date,
        discount: discountAmount,
        total_amount: Number(validatedData?.total_amount)!,
      },
      where: { id: Number(validatedData?.id) },
    });

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
