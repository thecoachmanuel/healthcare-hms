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

async function main() {
  const prisma = new PrismaClient();
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || process.env.BASE_DOMAIN || "").trim();
  const slug = "lasuth";
  const hospitalName = "LASUTH";

  // Ensure hospital #1 exists and has slug/name
  let hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: { name: hospitalName, slug, active: true },
    create: { id: 1, name: hospitalName, slug, active: true },
  });

  // Ensure trial is set for the first hospital if missing
  try {
    const settings = await prisma.saaSSettings.findFirst({ select: { trial_days_default: true } });
    const trialDays = settings?.trial_days_default ?? 30;
    hospital = await prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        trial_ends_at: hospital.trial_ends_at ?? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
      },
    });
  } catch {}

  // Ensure domain mapping
  if (baseDomain) {
    const domain = `${slug}.${baseDomain.replace(/^\./, "")}`.toLowerCase();
    await prisma.hospitalDomain.upsert({
      where: { domain },
      update: { hospital_id: hospital.id, verified: true },
      create: { hospital_id: hospital.id, domain, type: "SUBDOMAIN", verified: true },
    });
  }

  // Ensure SaaS settings exist
  const existingSettings = await prisma.saaSSettings.findFirst({ select: { id: true } }).catch(() => null);
  if (!existingSettings) {
    await prisma.saaSSettings.create({ data: { trial_days_default: 30 } }).catch(() => {});
  }

  // Backfill max_patients defaults for known plans
  const plans = await prisma.plan.findMany({ select: { id: true, name: true } }).catch(() => []);
  for (const p of plans) {
    let maxPatients = 1000;
    const name = (p.name || "").toLowerCase();
    if (name.includes("growth")) maxPatients = 5000;
    if (name.includes("enterprise") || name.includes("scale")) maxPatients = 20000;
    try {
      await prisma.plan.update({ where: { id: p.id }, data: { max_patients: maxPatients } });
    } catch {}
  }

  await prisma.$disconnect();
  console.log("Seeded hospital tenant:", { id: hospital.id, name: hospitalName, slug });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
