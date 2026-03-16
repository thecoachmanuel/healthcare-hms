"use server";
import { z } from "zod";
import db from "@/lib/db";

const EnqueueSchema = z.object({
  patientId: z.string().min(1),
  department: z.string().optional(),
  doctorId: z.string().optional(),
  intakeType: z.enum(["WALK_IN", "APPOINTMENT"]),
  appointmentId: z.number().optional(),
});

export async function enqueueVisit(input: z.infer<typeof EnqueueSchema>) {
  const data = EnqueueSchema.parse(input);
  const result = await db.$transaction(async (tx) => {
    const visit = await tx.visit.create({
      data: {
        patient_id: data.patientId,
        doctor_id: data.doctorId ?? null,
        department: data.department ?? null,
        intake_type: data.intakeType,
        appointment_id: data.appointmentId ?? null,
      },
    });

    const queueNumber = await nextQueueNumber(tx, data.department ?? "GEN");

    const ticket = await tx.queueTicket.create({
      data: {
        visit_id: visit.id,
        queue_number: queueNumber,
        department: data.department ?? null,
        doctor_id: data.doctorId ?? null,
      },
    });

    return { visitId: visit.id, ticketId: ticket.id, queueNumber };
  });
  return { success: true, ...result };
}

async function nextQueueNumber(tx: typeof db, scope: string) {
  const today = new Date();
  const y = today.getFullYear().toString().slice(-2);
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `${scope}-${y}${m}${d}-`;
  const last = await tx.queueTicket.findFirst({
    where: { queue_number: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { queue_number: true },
  });
  const seq = last?.queue_number ? parseInt(last.queue_number.split("-").pop() || "0", 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

const TriageSchema = z.object({
  visitId: z.number().int().positive(),
  nurseId: z.string().min(1),
  priority: z.enum(["RED", "YELLOW", "GREEN"]),
  notes: z.string().optional(),
});

export async function setTriage(input: z.infer<typeof TriageSchema>) {
  const data = TriageSchema.parse(input);
  const res = await db.$transaction(async (tx) => {
    const triage = await tx.triage.upsert({
      where: { visit_id: data.visitId },
      update: { nurse_id: data.nurseId, priority: data.priority, notes: data.notes ?? null, triaged_at: new Date() },
      create: { visit_id: data.visitId, nurse_id: data.nurseId, priority: data.priority, notes: data.notes ?? null },
    });
    await tx.queueTicket.update({ where: { visit_id: data.visitId }, data: { priority: data.priority } });
    return triage.id;
  });
  return { success: true, triageId: res };
}

export async function callNextPatient(doctorId: string, department: string) {
  const rows = await db.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "QueueTicket"
    WHERE status = 'WAITING' AND (doctor_id = ${doctorId} OR department = ${department})
    ORDER BY CASE priority WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END ASC, arrival_time ASC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { success: false, msg: "No waiting patients" };
  const ticket = await db.queueTicket.update({ where: { id: row.id }, data: { status: "CALLED", called_at: new Date() }, include: { visit: true } });
  const ticket = await db.queueTicket.update({ where: { id: row.id }, data: { status: "CALLED", called_at: new Date() }, include: { visit: true } });
  return { success: true, ticketId: ticket.id, visitId: ticket.visit_id };

  // Notify called patient
  try {
    const calledVisit = await db.visit.findUnique({ where: { id: ticket.visit_id }, select: { patient_id: true } });
    if (calledVisit) {
      await db.notification.create({ data: { user_id: calledVisit.patient_id, title: 'You are being called', body: 'Please proceed to the consulting room.' } });
    }
  } catch {}

  // Notify next in line (up to 2) that it's almost their turn
  try {
    const nextRows = await db.$queryRaw<Array<{ id: number, visit_id: number }>>`
      SELECT id, visit_id FROM "QueueTicket"
      WHERE status = 'WAITING' AND (doctor_id = ${doctorId} OR department = ${department})
      ORDER BY CASE priority WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END ASC, arrival_time ASC
      LIMIT 2
    `;
    for (const n of nextRows) {
      const v = await db.visit.findUnique({ where: { id: n.visit_id }, select: { patient_id: true } });
      if (v) {
        await db.notification.create({ data: { user_id: v.patient_id, title: 'Almost your turn', body: 'Please stay nearby, you will be called shortly.' } });
      }
    }
  } catch {}
}


export async function markInConsultation(ticketId: number, doctorId: string) {
  const ticket = await db.queueTicket.update({ where: { id: ticketId }, data: { status: "IN_CONSULTATION", started_at: new Date() } });
  await db.doctorStatus.upsert({ where: { doctor_id: doctorId }, update: { is_available: false, current_visit_id: ticket.visit_id }, create: { doctor_id: doctorId, is_available: false, current_visit_id: ticket.visit_id } });
  return { success: true };
}

export async function completeConsultation(ticketId: number, doctorId: string) {
  await db.queueTicket.update({ where: { id: ticketId }, data: { status: "COMPLETED", completed_at: new Date() } });
  await db.doctorStatus.upsert({ where: { doctor_id: doctorId }, update: { is_available: true, current_visit_id: null }, create: { doctor_id: doctorId, is_available: true, current_visit_id: null } });
  return { success: true };
}

export async function skipTicket(ticketId: number) {
  await db.queueTicket.update({ where: { id: ticketId }, data: { status: "SKIPPED", skip_count: { increment: 1 } } });
  return { success: true };
}

export async function markNoShow(ticketId: number) {
  await db.queueTicket.update({ where: { id: ticketId }, data: { status: "NO_SHOW", no_show_marked: true } });
  return { success: true };
}

export async function getQueueForDepartment(department: string) {
  const tickets = await db.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "QueueTicket" WHERE status = 'WAITING' AND department = ${department}
    ORDER BY CASE priority WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END ASC, arrival_time ASC
  `;
  return tickets.map((t) => t.id);
}

export async function getPatientPosition(visitId: number) {
  const ticket = await db.queueTicket.findUnique({ where: { visit_id: visitId } });
  if (!ticket) return { position: null };
  const rows = await db.$queryRaw<Array<{ cnt: number }>>`
    SELECT COUNT(*)::int AS cnt FROM "QueueTicket"
    WHERE status = 'WAITING'
      AND (
        CASE priority WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END <
        CASE ${ticket.priority} WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END
        OR (priority = ${ticket.priority} AND arrival_time <= ${ticket.arrival_time})
      )
      AND (department = ${ticket.department} OR ${ticket.department} IS NULL)
  `;
  const position = rows[0]?.cnt ?? 0;
  return { position };
}

// Mark no-shows for appointments whose window_end has passed and no visit exists
export async function sweepNoShows(nowISO?: string) {
  const now = nowISO ? new Date(nowISO) : new Date();
  const appts = await db.appointment.findMany({
    where: { window_end: { lt: now }, status: { in: ["PENDING", "SCHEDULED"] } },
    select: { id: true, patient_id: true }
  });
  let count = 0;
  for (const a of appts) {
    const v = await db.visit.findFirst({ where: { appointment_id: a.id } });
    if (!v) {
      await db.appointment.update({ where: { id: a.id }, data: { status: 'CANCELLED', reason: 'No-show after window' } });
      await db.notification.create({ data: { user_id: a.patient_id, title: 'Appointment marked no-show', body: 'Your time window elapsed without check-in. Please reschedule.' } });
      count++;
    }
  }
  return { success: true, count };
}

// Notify patients of doctor delays for all waiting tickets assigned to a doctor
export async function setDoctorDelay(doctorId: string, minutes: number, message?: string) {
  const rows = await db.queueTicket.findMany({ where: { doctor_id: doctorId, status: 'WAITING' }, select: { visit_id: true } });
  for (const r of rows) {
    const v = await db.visit.findUnique({ where: { id: r.visit_id }, select: { patient_id: true } });
    if (v) {
      await db.notification.create({ data: { user_id: v.patient_id, title: 'Doctor delayed', body: message ?? `Doctor delayed by ~${minutes} minutes. Thank you for your patience.` } });
    }
  }
  return { success: true, count: rows.length };
}
