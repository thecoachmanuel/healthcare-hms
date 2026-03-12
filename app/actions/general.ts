"use server";

import {
  ReviewFormValues,
  reviewSchema,
} from "@/components/dialogs/review-form";
import db from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

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
    data: { total_amount: totalAmount, amount_paid: amountPaid, status },
  });
}

export async function deleteDataById(
  id: string,

  deleteType: "doctor" | "staff" | "patient" | "payment" | "bill"
) {
  try {
    switch (deleteType) {
      case "doctor":
        await db.doctor.delete({ where: { id: id } });
        break;
      case "staff":
        await db.staff.delete({ where: { id: id } });
        break;
      case "patient":
        await db.patient.delete({ where: { id: id } });
        break;
      case "payment":
        await db.payment.delete({ where: { id: Number(id) } });
        break;
      case "bill": {
        const bill = await db.patientBills.findUnique({
          where: { id: Number(id) },
          select: { bill_id: true },
        });
        if (bill) {
          await db.patientBills.delete({ where: { id: Number(id) } });
          await recomputePayment(bill.bill_id);
        }
        break;
      }
      default:
        break;
    }

    if (
      deleteType === "staff" ||
      deleteType === "patient" ||
      deleteType === "doctor"
    ) {
      const supabaseAdmin = createSupabaseAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(id);
    }

    return {
      success: true,
      message: "Data deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Internal Server Error",
      status: 500,
    };
  }
}

export async function createReview(values: ReviewFormValues) {
  try {
    const userId = await requireAuthUserId();
    const isPatient = await checkRole("PATIENT");
    if (!isPatient) {
      return {
        success: false,
        message: "Only patients can submit reviews",
        status: 403,
      };
    }

    const validatedFields = reviewSchema.parse({
      ...values,
      patient_id: userId,
    });

    await db.rating.create({
      data: {
        ...validatedFields,
      },
    });

    return {
      success: true,
      message: "Review created successfully",
      status: 200,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Internal Server Error",
      status: 500,
    };
  }
}
