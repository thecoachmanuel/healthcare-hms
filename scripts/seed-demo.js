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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const { faker } = require("@faker-js/faker");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment`);
  return v;
}

function randColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}

async function withRetry(fn, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
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
  if (!existingId) throw error ?? new Error(`Failed to create user for ${email}`);
  const { error: updateError } = await supabase.auth.admin.updateUserById(existingId, {
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
    app_metadata: { role },
  });
  if (updateError) throw updateError;
  return existingId;
}

async function main() {
  const prisma = new PrismaClient();
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const USERS = [
    { role: "admin", email: "admin@lasuth.org.ng", password: "lasuth2026", name: "Admin Lasuth" },
    { role: "doctor", email: "doctor1@lasuth.org.ng", password: "lasuth2026", name: "Doctor One" },
    { role: "nurse", email: "nurse1@lasuth.org.ng", password: "lasuth2026", name: "Nurse One" },
    { role: "lab_scientist", email: "labscientist1@lasuth.org.ng", password: "lasuth2026", name: "Lab Scientist" },
    { role: "cashier", email: "cashier1@lasuth.org.ng", password: "lasuth2026", name: "Cashier One" },
    { role: "pharmacist", email: "pharmacist1@lasuth.org.ng", password: "lasuth2026", name: "Pharmacist One" },
    { role: "record_officer", email: "record1@lasuth.org.ng", password: "lasuth2026", name: "Record Officer" },
    { role: "receptionist", email: "reception1@lasuth.org.ng", password: "lasuth2026", name: "Receptionist One" },
    { role: "lab_receptionist", email: "labreception1@lasuth.org.ng", password: "lasuth2026", name: "Lab Reception" },
  ];

  const ids = {};
  for (const u of USERS) {
    const id = await ensureAuthUser({
      supabase,
      email: u.email,
      password: u.password,
      role: u.role,
      firstName: u.name.split(" ")[0],
      lastName: u.name.split(" ").slice(1).join(" ") || u.role,
    });
    ids[u.role] = id;
  }

  // Seed departments
  const departments = [
    "General Medicine",
    "Pediatrics",
    "Maternity",
    "Surgery",
    "ICU",
    "Pharmacy",
    "Laboratory",
    "Radiology",
    "Medical Records",
    "Finance",
    "Nursing",
    "Administration",
  ];
  await withRetry(() =>
    prisma.department.createMany({ data: departments.map((name) => ({ name, active: true })), skipDuplicates: true })
  );

  // Wards
  const wards = [
    { name: "General Ward", department: "General Medicine", capacity: 40 },
    { name: "Pediatrics Ward", department: "Pediatrics", capacity: 20 },
    { name: "Maternity Ward", department: "Maternity", capacity: 20 },
    { name: "Surgical Ward", department: "Surgery", capacity: 18 },
    { name: "ICU", department: "ICU", capacity: 10 },
  ];
  await withRetry(() => prisma.ward.createMany({ data: wards.map((w) => ({ ...w, active: true })), skipDuplicates: true }));

  // Lab units
  const labUnits = [
    "Hematology",
    "Chemical Pathology",
    "Medical Microbiology",
    "Histopathology",
    "Blood Transfusion",
  ];
  await withRetry(() => prisma.labUnit.createMany({ data: labUnits.map((name) => ({ name, active: true })), skipDuplicates: true }));
  const labUnitRows = await prisma.labUnit.findMany();

  // Services: general, labs, medications
  const generalServices = [
    { service_name: "Consultation", description: "Doctor consultation", price: 5000, category: "GENERAL" },
    { service_name: "Admission Fee", description: "Inpatient admission", price: 15000, category: "GENERAL" },
  ];
  const labServices = [
    { service_name: "Full Blood Count", description: "Hematology", price: 4000, unit: "Hematology" },
    { service_name: "Liver Function Test", description: "Chem Path", price: 8500, unit: "Chemical Pathology" },
    { service_name: "Malaria Parasite", description: "Microbiology", price: 2500, unit: "Medical Microbiology" },
  ];
  const medicationServices = [
    { service_name: "Amoxicillin 500mg", description: "Capsule", price: 300, category: "MEDICATION" },
    { service_name: "Paracetamol 500mg", description: "Tablet", price: 50, category: "MEDICATION" },
    { service_name: "Ibuprofen 400mg", description: "Tablet", price: 120, category: "MEDICATION" },
  ];

  await withRetry(() =>
    prisma.services.createMany({
      data: generalServices.map((s) => ({ ...s, created_by_id: ids.admin, created_by_role: "ADMIN" })),
      skipDuplicates: true,
    })
  );

  for (const s of labServices) {
    const unit = labUnitRows.find((u) => u.name === s.unit);
    if (!unit) continue;
    await prisma.services.upsert({
      where: { id: 0 },
      update: {},
      create: {
        service_name: s.service_name,
        description: s.description,
        price: s.price,
        category: "LAB_TEST",
        lab_unit_id: unit.id,
        created_by_id: ids.lab_scientist,
        created_by_role: "LAB_SCIENTIST",
      },
    });
  }

  await withRetry(() =>
    prisma.services.createMany({ data: medicationServices, skipDuplicates: true })
  );

  // Staff profiles for the ensured auth users
  const staffUpserts = [
    { id: ids.admin, email: USERS[0].email, name: USERS[0].name, department: "Administration", role: "ADMIN" },
    { id: ids.nurse, email: USERS[2].email, name: USERS[2].name, department: "Nursing", role: "NURSE" },
    { id: ids.lab_scientist, email: USERS[3].email, name: USERS[3].name, department: "Laboratory", role: "LAB_SCIENTIST" },
    { id: ids.cashier, email: USERS[4].email, name: USERS[4].name, department: "Finance", role: "CASHIER" },
    { id: ids.pharmacist, email: USERS[5].email, name: USERS[5].name, department: "Pharmacy", role: "PHARMACIST" },
    { id: ids.record_officer, email: USERS[6].email, name: USERS[6].name, department: "Medical Records", role: "RECORD_OFFICER" },
    { id: ids.receptionist, email: USERS[7].email, name: USERS[7].name, department: "Outpatient", role: "RECEPTIONIST" },
    { id: ids.lab_receptionist, email: USERS[8].email, name: USERS[8].name, department: "Laboratory", role: "LAB_RECEPTIONIST" },
  ];
  for (const s of staffUpserts) {
    await withRetry(() =>
      prisma.staff.upsert({
        where: { id: s.id },
        update: { email: s.email, name: s.name, department: s.department, role: s.role, status: "ACTIVE" },
        create: {
          id: s.id,
          email: s.email,
          name: s.name,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          department: s.department,
          role: s.role,
          status: "ACTIVE",
          colorCode: randColor(),
        },
      })
    );
  }

  // Doctor profile for doctor user + 4 more doctors
  const doctorId = ids.doctor;
  await withRetry(() =>
    prisma.doctor.upsert({
      where: { id: doctorId },
      update: {
        email: USERS[1].email,
        name: USERS[1].name,
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
        email: USERS[1].email,
        name: USERS[1].name,
        specialization: "General Practice",
        license_number: "LASUTH-DOC-0001",
        phone: "080000000003",
        address: "LASUTH, Ikeja",
        department: "General Medicine",
        type: "FULL",
        availability_status: "ACTIVE",
        colorCode: randColor(),
      },
    })
  );

  const extraDoctors = [];
  for (let i = 0; i < 4; i++) {
    const id = faker.string.uuid();
    extraDoctors.push(
      await prisma.doctor.upsert({
        where: { id },
        update: {},
        create: {
          id,
          email: faker.internet.email(),
          name: `Doctor ${i + 2}`,
          specialization: faker.person.jobType(),
          license_number: `LASUTH-DOC-00${i + 2}`,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          department: ["Pediatrics", "Maternity", "Surgery", "Radiology"][i],
          type: i % 2 === 0 ? "FULL" : "PART",
          availability_status: "ACTIVE",
          colorCode: randColor(),
        },
      })
    );
  }

  const allDoctors = [doctorId, ...extraDoctors.map((d) => d.id)];
  // Working days for doctors
  for (const id of allDoctors) {
    const exist = await prisma.workingDays.findMany({ where: { doctor_id: id }, take: 1 });
    if (exist.length === 0) {
      await prisma.workingDays.createMany({
        data: [
          { doctor_id: id, day: "Monday", start_time: "09:00", close_time: "17:00" },
          { doctor_id: id, day: "Wednesday", start_time: "09:00", close_time: "17:00" },
          { doctor_id: id, day: "Friday", start_time: "09:00", close_time: "15:00" },
        ],
      });
    }
  }

  // Patients
  const patients = [];
  for (let i = 0; i < 30; i++) {
    patients.push(
      await prisma.patient.upsert({
        where: { email: `patient${i + 1}@demo.local` },
        update: {},
        create: {
          id: faker.string.uuid(),
          hospital_number: `HOSP-${1000 + i}`,
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          date_of_birth: faker.date.birthdate({ min: 18, max: 85, mode: "age" }),
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          phone: faker.phone.number(),
          email: `patient${i + 1}@demo.local`,
          marital_status: i % 3 === 0 ? "Married" : "Single",
          address: faker.location.streetAddress(),
          emergency_contact_name: faker.person.fullName(),
          emergency_contact_number: faker.phone.number(),
          relation: "Sibling",
          blood_group: ["O+", "A+", "B+", "AB+"][i % 4],
          allergies: faker.lorem.words({ min: 1, max: 3 }),
          medical_conditions: faker.lorem.words({ min: 1, max: 3 }),
          privacy_consent: true,
          service_consent: true,
          medical_consent: true,
          colorCode: randColor(),
        },
      })
    );
  }

  // Appointments + Payments + Medical Records + Prescriptions + Lab Tests
  const services = await prisma.services.findMany();
  const consult = services.find((s) => s.service_name === "Consultation");
  const meds = services.filter((s) => s.category === "MEDICATION");
  const labCatalog = services.filter((s) => s.category === "LAB_TEST");

  const appts = [];
  for (let i = 0; i < 40; i++) {
    const patient = patients[i % patients.length];
    const doctorIdSel = allDoctors[i % allDoctors.length];
    const status = ["PENDING", "SCHEDULED", "COMPLETED"][i % 3];
    appts.push(
      await prisma.appointment.create({
        data: {
          patient_id: patient.id,
          doctor_id: doctorIdSel,
          appointment_date: faker.date.soon({ days: 14 }),
          time: ["09:00", "10:00", "11:30", "14:00"][i % 4],
          status,
          type: "General Consultation",
          reason: faker.lorem.sentence(),
        },
      })
    );
  }

  for (let i = 0; i < appts.length; i++) {
    const a = appts[i];
    const patient = patients[i % patients.length];
    // Payment + bills (consult + optional lab)
    const bills = [];
    if (consult) {
      bills.push({ service_id: consult.id, quantity: 1, unit_cost: consult.price });
    }
    const extraLab = labCatalog[i % labCatalog.length];
    if (extraLab) bills.push({ service_id: extraLab.id, quantity: 1, unit_cost: extraLab.price });

    const total = bills.reduce((sum, b) => sum + b.quantity * b.unit_cost, 0);
    const paid = i % 3 === 0 ? total : i % 3 === 1 ? total / 2 : 0;
    const payStatus = paid === 0 ? "UNPAID" : paid < total ? "PART" : "PAID";

    const payment = await prisma.payment.create({
      data: {
        patient_id: patient.id,
        appointment_id: a.id,
        bill_date: new Date(),
        payment_date: new Date(),
        discount: 0,
        total_amount: total,
        amount_paid: paid,
        payment_method: i % 2 === 0 ? "CASH" : "CARD",
        status: payStatus,
      },
    });

    for (const b of bills) {
      await prisma.patientBills.create({
        data: {
          bill_id: payment.id,
          service_id: b.service_id,
          service_date: new Date(),
          quantity: b.quantity,
          unit_cost: b.unit_cost,
          total_cost: b.quantity * b.unit_cost,
          payment_status: payStatus,
          amount_paid: paid >= b.unit_cost ? Math.min(b.quantity * b.unit_cost, paid) : 0,
          notes: "Demo bill",
        },
      });
    }

    // Medical record + vitals + diagnosis
    const med = await prisma.medicalRecords.create({
      data: {
        patient_id: patient.id,
        appointment_id: a.id,
        doctor_id: a.doctor_id,
        treatment_plan: faker.lorem.sentence(),
        lab_request: "",
        prescriptions: "",
        notes: faker.lorem.sentence(),
      },
    });

    await prisma.vitalSigns.create({
      data: {
        patient_id: patient.id,
        medical_id: med.id,
        body_temperature: 36.6 + Math.random(),
        systolic: 110 + (i % 20),
        diastolic: 70 + (i % 10),
        heartRate: String(70 + (i % 15)),
        respiratory_rate: 16,
        oxygen_saturation: 98,
        weight: 60 + (i % 20),
        height: 1.6 + (i % 40) / 100,
      },
    });

    await prisma.diagnosis.create({
      data: {
        patient_id: patient.id,
        medical_id: med.id,
        doctor_id: a.doctor_id,
        symptoms: faker.lorem.words(3),
        diagnosis: ["Malaria", "Typhoid", "Hypertension"][i % 3],
        notes: faker.lorem.sentence(),
        prescribed_medications: "",
        follow_up_plan: "1 week",
      },
    });

    // Lab tests
    if (labCatalog.length > 0) {
      const labService = labCatalog[i % labCatalog.length];
      const statuses = ["REQUESTED", "SAMPLE_COLLECTED", "RECEIVED", "IN_PROGRESS", "COMPLETED", "APPROVED"];
      const st = statuses[i % statuses.length];
      await prisma.labTest.create({
        data: {
          record_id: med.id,
          test_date: new Date(),
          result: st === "APPROVED" || st === "COMPLETED" ? "Within reference range" : "PENDING",
          status: st,
          notes: "Demo lab test",
          sample_id: st !== "REQUESTED" ? `LAB-${1000 + i}` : null,
          approved_by_id: st === "APPROVED" ? ids.lab_scientist : null,
          service_id: labService.id,
        },
      });
    }

    // Prescriptions + administrations
    const rx = await prisma.prescription.create({
      data: {
        patient_id: patient.id,
        doctor_id: a.doctor_id,
        appointment_id: a.id,
        notes: faker.lorem.sentence(),
        status: "ISSUED",
      },
    });
    const itemCount = 1 + (i % Math.min(2, meds.length));
    for (let k = 0; k < itemCount; k++) {
      const medSvc = meds[(i + k) % meds.length];
      const item = await prisma.prescriptionItem.create({
        data: {
          prescription_id: rx.id,
          medication_id: medSvc.id,
          quantity: 1 + (k % 2),
          dosage: "1 tab bd",
          instructions: "After meals",
        },
      });
      if (i % 2 === 0) {
        await prisma.medicationAdministration.create({
          data: {
            prescription_item_id: item.id,
            patient_id: patient.id,
            nurse_id: ids.nurse,
            quantity: 1,
            notes: "Administered",
          },
        });
      }
    }
  }

  // Admissions
  const ward = await prisma.ward.findFirst({ where: { name: "General Ward" } });
  if (ward) {
    for (let i = 0; i < 6; i++) {
      const patient = patients[(i * 3) % patients.length];
      const status = i % 3 === 0 ? "DISCHARGED" : "ADMITTED";
      await prisma.inpatientAdmission.create({
        data: {
          patient_id: patient.id,
          ward_id: ward.id,
          attending_doctor_id: doctorId,
          admitted_by_id: ids.nurse,
          admitted_by_role: "NURSE",
          status,
          discharged_at: status === "DISCHARGED" ? new Date() : null,
          discharge_notes: status === "DISCHARGED" ? "Recovered" : null,
        },
      });
    }
  }

  await prisma.$disconnect();
  console.log("Demo seed complete.");
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});

