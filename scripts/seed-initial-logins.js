const fs = require("fs");
const path = require("path");

function loadEnvFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) return;

  const contents = fs.readFileSync(fullPath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing ${name} in environment`);
  }
  return v;
}

function randomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function withRetry(fn, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const backoffMs = 500 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastError;
}

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser({ supabase, email, password, role, firstName, lastName }) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
    app_metadata: { role },
  });

  if (!error && created?.user?.id) return created.user.id;

  const existingId = await findUserIdByEmail(supabase, email);
  if (!existingId) {
    throw error ?? new Error(`Failed to create user for ${email}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingId, {
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
    app_metadata: { role },
  });

  if (updateError) throw updateError;
  return existingId;
}

async function seed() {
  const prisma = new PrismaClient();
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const ADMIN = { email: "admin@lasuth.org.ng", password: "lasuth2026", role: "admin" };
  const DOCTOR = { email: "doctor1@lasuth.org.ng", password: "lasuth2026", role: "doctor" };
  const NURSE = { email: "nurse1@lasuth.org.ng", password: "lasuth2026", role: "nurse" };
  const LAB_SCIENTIST = {
    email: "labscientist1@lasuth.org.ng",
    password: "lasuth2026",
    role: "lab_scientist",
  };
  const CASHIER = { email: "cashier1@lasuth.org.ng", password: "lasuth2026", role: "cashier" };

  const adminId = await ensureAuthUser({
    supabase,
    email: ADMIN.email,
    password: ADMIN.password,
    role: ADMIN.role,
    firstName: "Admin",
    lastName: "Lasuth",
  });

  const doctorId = await ensureAuthUser({
    supabase,
    email: DOCTOR.email,
    password: DOCTOR.password,
    role: DOCTOR.role,
    firstName: "Doctor",
    lastName: "One",
  });

  const nurseId = await ensureAuthUser({
    supabase,
    email: NURSE.email,
    password: NURSE.password,
    role: NURSE.role,
    firstName: "Nurse",
    lastName: "One",
  });

  const labScientistId = await ensureAuthUser({
    supabase,
    email: LAB_SCIENTIST.email,
    password: LAB_SCIENTIST.password,
    role: LAB_SCIENTIST.role,
    firstName: "Lab",
    lastName: "Scientist",
  });

  const cashierId = await ensureAuthUser({
    supabase,
    email: CASHIER.email,
    password: CASHIER.password,
    role: CASHIER.role,
    firstName: "Cashier",
    lastName: "One",
  });

  await withRetry(() =>
    prisma.staff.upsert({
    where: { id: adminId },
    update: {
      email: ADMIN.email,
      name: "Admin Lasuth",
      phone: "080000000001",
      address: "LASUTH, Ikeja",
      department: "Administration",
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      id: adminId,
      email: ADMIN.email,
      name: "Admin Lasuth",
      phone: "080000000001",
      address: "LASUTH, Ikeja",
      department: "Administration",
      role: "ADMIN",
      status: "ACTIVE",
      colorCode: randomColor(),
    },
    })
  );

  await withRetry(() =>
    prisma.staff.upsert({
    where: { id: nurseId },
    update: {
      email: NURSE.email,
      name: "Nurse One",
      phone: "080000000002",
      address: "LASUTH, Ikeja",
      department: "Nursing",
      role: "NURSE",
      status: "ACTIVE",
    },
    create: {
      id: nurseId,
      email: NURSE.email,
      name: "Nurse One",
      phone: "080000000002",
      address: "LASUTH, Ikeja",
      department: "Nursing",
      role: "NURSE",
      status: "ACTIVE",
      colorCode: randomColor(),
    },
    })
  );

  await withRetry(() =>
    prisma.staff.upsert({
    where: { id: labScientistId },
    update: {
      email: LAB_SCIENTIST.email,
      name: "Lab Scientist",
      phone: "080000000004",
      address: "LASUTH, Ikeja",
      department: "Laboratory",
      role: "LAB_TECHNICIAN",
      status: "ACTIVE",
    },
    create: {
      id: labScientistId,
      email: LAB_SCIENTIST.email,
      name: "Lab Scientist",
      phone: "080000000004",
      address: "LASUTH, Ikeja",
      department: "Laboratory",
      role: "LAB_TECHNICIAN",
      status: "ACTIVE",
      colorCode: randomColor(),
    },
    })
  );

  await withRetry(() =>
    prisma.staff.upsert({
    where: { id: cashierId },
    update: {
      email: CASHIER.email,
      name: "Cashier One",
      phone: "080000000005",
      address: "LASUTH, Ikeja",
      department: "Finance",
      role: "CASHIER",
      status: "ACTIVE",
    },
    create: {
      id: cashierId,
      email: CASHIER.email,
      name: "Cashier One",
      phone: "080000000005",
      address: "LASUTH, Ikeja",
      department: "Finance",
      role: "CASHIER",
      status: "ACTIVE",
      colorCode: randomColor(),
    },
    })
  );

  await withRetry(() =>
    prisma.doctor.upsert({
    where: { id: doctorId },
    update: {
      email: DOCTOR.email,
      name: "Doctor One",
      specialization: "General Practice",
      license_number: "LASUTH-DOC-0001",
      phone: "080000000003",
      address: "LASUTH, Ikeja",
      department: "General Medicine",
      type: "FULL",
      availability_status: "ACTIVE",
    },
    create: {
      id: doctorId,
      email: DOCTOR.email,
      name: "Doctor One",
      specialization: "General Practice",
      license_number: "LASUTH-DOC-0001",
      phone: "080000000003",
      address: "LASUTH, Ikeja",
      department: "General Medicine",
      type: "FULL",
      availability_status: "ACTIVE",
      colorCode: randomColor(),
    },
    })
  );

  const existingWorkingDays = await withRetry(() =>
    prisma.workingDays.findMany({
      where: { doctor_id: doctorId },
      select: { id: true },
      take: 1,
    })
  );

  if (existingWorkingDays.length === 0) {
    await withRetry(() =>
      prisma.workingDays.createMany({
        data: [
          { doctor_id: doctorId, day: "Monday", start_time: "09:00", close_time: "17:00" },
          { doctor_id: doctorId, day: "Wednesday", start_time: "09:00", close_time: "17:00" },
        ],
      })
    );
  }

  await prisma.$disconnect();

  console.log("Seeded logins:");
  console.log(`- Admin:  ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`- Doctor: ${DOCTOR.email} / ${DOCTOR.password}`);
  console.log(`- Nurse:  ${NURSE.email} / ${NURSE.password}`);
  console.log(`- Lab Scientist: ${LAB_SCIENTIST.email} / ${LAB_SCIENTIST.password}`);
  console.log(`- Cashier: ${CASHIER.email} / ${CASHIER.password}`);
}

seed().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
