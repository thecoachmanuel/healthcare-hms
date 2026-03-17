"use server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getRole } from "@/utils/roles";

const EnqueueSchema = z.object({
  patientId: z.string().min(1).optional(),
  department: z.string().optional(),
  doctorId: z.string().optional(),
  intakeType: z.enum(["WALK_IN", "APPOINTMENT"]),
  appointmentId: z.number().optional(),
});

export async function enqueueVisit(input: z.infer<typeof EnqueueSchema>) {
  const data = EnqueueSchema.parse(input);

  const actor = await getAuthUser();
  const actorId = actor?.id ?? null;
  const role = await getRole();
  const actorRole = (() => {
    const r = role.trim().toLowerCase();
    if (r === "admin") return "ADMIN" as const;
    if (r === "doctor") return "DOCTOR" as const;
    if (r === "nurse") return "NURSE" as const;
    if (r === "receptionist") return "RECEPTIONIST" as const;
    if (r === "record_officer") return "RECORD_OFFICER" as const;
    if (r === "cashier") return "CASHIER" as const;
    if (r === "lab_scientist") return "LAB_SCIENTIST" as const;
    if (r === "lab_technician") return "LAB_TECHNICIAN" as const;
    if (r === "lab_receptionist") return "LAB_RECEPTIONIST" as const;
    if (r === "pharmacist") return "PHARMACIST" as const;
    if (r === "patient") return "PATIENT" as const;
    return null;
  })();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await db.$transaction(async (tx) => {
    let patientId = data.patientId ?? null as null | string;
    let doctorId = data.doctorId ?? null as null | string;
    let department = data.department ?? null as null | string;
    let intakeType = data.intakeType;

    if (!department && actorId) {
      const [staff, doctor] = await Promise.all([
        tx.staff.findUnique({ where: { id: actorId }, select: { department: true } }),
        tx.doctor.findUnique({ where: { id: actorId }, select: { department: true } }),
      ]);
      department = staff?.department ?? doctor?.department ?? null;
      doctorId = doctorId ?? (doctor ? actorId : null);
    }

    if (data.appointmentId) {
      const appt = await tx.appointment.findUnique({ where: { id: data.appointmentId }, select: { patient_id: true, doctor_id: true } });
      if (!appt) throw new Error("Appointment not found");

      const scopeDept = (department ?? "GEN").trim();

      const existingVisit = await tx.visit.findFirst({ where: { appointment_id: data.appointmentId }, select: { id: true } });
      if (existingVisit) {
        const existingTicket = await tx.queueTicket.findUnique({ where: { visit_id: existingVisit.id }, select: { id: true, visit_id: true, queue_number: true } });
        if (existingTicket) {
          return { visitId: existingTicket.visit_id, ticketId: existingTicket.id, queueNumber: existingTicket.queue_number };
        }
        const queueNumber = await nextQueueNumber(tx, scopeDept);
        const ticket = await tx.queueTicket.create({
          data: {
            visit_id: existingVisit.id,
            queue_number: queueNumber,
            department: scopeDept,
            doctor_id: doctorId,
          },
        });
        return { visitId: existingVisit.id, ticketId: ticket.id, queueNumber };
      }

      patientId = patientId ?? appt.patient_id;
      doctorId = doctorId ?? appt.doctor_id;
      const doc = await tx.doctor.findUnique({ where: { id: doctorId! }, select: { department: true } });
      department = department ?? doc?.department ?? null;
      intakeType = "APPOINTMENT";
    }

    if (doctorId && !department) {
      const doc = await tx.doctor.findUnique({ where: { id: doctorId }, select: { department: true } });
      department = doc?.department ?? null;
    }

    if (!doctorId && department) {
      const doctors = await tx.doctor.findMany({ where: { department: { equals: department, mode: 'insensitive' } }, select: { id: true } });
      if (doctors.length > 0) {
        const loads = await Promise.all(
          doctors.map(async (d) => {
            const cnt = await tx.queueTicket.count({ where: { status: { in: ['WAITING','CALLED','IN_CONSULTATION'] }, doctor_id: d.id } });
            const avail = await tx.doctorStatus.findUnique({ where: { doctor_id: d.id }, select: { is_available: true } });
            return { id: d.id, load: cnt, available: Boolean(avail?.is_available) };
          })
        );
        const available = loads.filter((l) => l.available).sort((a,b) => a.load - b.load);
        doctorId = (available[0] ?? loads.sort((a,b)=>a.load-b.load)[0])?.id ?? null;
      }
    }

    department = (department ?? "GEN").trim();

    if (!patientId) throw new Error("patientId required");

    const existing = await tx.queueTicket.findFirst({
      where: {
        status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
        arrival_time: { gte: startOfDay },
        visit: {
          patient_id: patientId,
          ...(doctorId ? { doctor_id: doctorId } : { department: department }),
        },
      },
      select: { id: true, visit_id: true, queue_number: true },
    });
    if (existing) return { visitId: existing.visit_id, ticketId: existing.id, queueNumber: existing.queue_number };

    const visit = await tx.visit.create({
      data: {
        patient_id: patientId,
        doctor_id: doctorId,
        department: department,
        intake_type: intakeType,
        appointment_id: data.appointmentId ?? null,
        created_by_id: actorId,
        created_by_role: actorRole,
      },
    });

    const queueNumber = await nextQueueNumber(tx, department);

    const ticket = await tx.queueTicket.create({
      data: {
        visit_id: visit.id,
        queue_number: queueNumber,
        department: department,
        doctor_id: doctorId,
      },
    });

    return { visitId: visit.id, ticketId: ticket.id, queueNumber };
  });
  return { success: true, ...result };
}

async function nextQueueNumber(tx: Prisma.TransactionClient, scope: string) {
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

  return { success: true, ticketId: ticket.id, visitId: ticket.visit_id };
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

export async function setDoctorAvailability(doctorId: string, isAvailable: boolean) {
  await db.doctorStatus.upsert({
    where: { doctor_id: doctorId },
    update: { is_available: isAvailable, current_visit_id: isAvailable ? null : undefined },
    create: { doctor_id: doctorId, is_available: isAvailable, current_visit_id: null },
  });
  return { success: true };
}
