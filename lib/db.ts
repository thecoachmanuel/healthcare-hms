import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

type CachedTenant = { hospitalId: number; expiresAt: number };

const TENANT_CACHE_TTL_MS = 60_000;
const tenantCache = new Map<string, CachedTenant>();

function safeLowerHost(host: string) {
  const raw = host.trim();
  if (!raw) return "";
  return raw.split(":")[0].toLowerCase();
}

function getBaseDomainFromEnv() {
  const configured = process.env.BASE_DOMAIN?.trim();
  if (configured) return configured.toLowerCase();

  const publicConfigured = process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim();
  if (publicConfigured) return publicConfigured.toLowerCase();

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.toLowerCase();

  return "";
}

function parseHospitalSlugFromHost(host: string, baseDomain: string) {
  if (!host) return null;
  if (!baseDomain) return null;

  if (host === baseDomain) return null;
  if (!host.endsWith(`.${baseDomain}`)) return null;

  const subdomain = host.slice(0, -(baseDomain.length + 1));
  if (!subdomain) return null;

  const first = subdomain.split(".")[0]?.trim();
  if (!first) return null;
  if (first === "www") return null;
  return first;
}

export async function resolveHospitalIdFromRequest() {
  try {
    const h = await headers();
    const host = safeLowerHost(h.get("x-tenant-host") ?? h.get("x-forwarded-host") ?? h.get("host") ?? "");
    if (!host) return 1;

    const cached = tenantCache.get(host);
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.hospitalId;

    const baseDomain = getBaseDomainFromEnv();
    const slug = parseHospitalSlugFromHost(host, baseDomain);

    const hospitalId = await (async () => {
      if (slug) {
        const hospital = await db.hospital.findFirst({
          where: { slug },
          select: { id: true },
        });
        if (hospital?.id) return hospital.id;
      }

      const mapped = await db.hospitalDomain.findFirst({
        where: { domain: host, verified: true },
        select: { hospital_id: true },
      });
      if (mapped?.hospital_id) return mapped.hospital_id;

      return 1;
    })();

    tenantCache.set(host, { hospitalId, expiresAt: now + TENANT_CACHE_TTL_MS });
    return hospitalId;
  } catch {
    return 1;
  }
}

async function isMasterAdminRequest() {
  try {
    const role = ((await headers()).get("x-user-role") ?? "").toLowerCase();
    return role === "master_admin";
  } catch {
    return false;
  }
}

const tenantScopedModels = new Set([
  "Patient",
  "Doctor",
  "WorkingDays",
  "Staff",
  "Ward",
  "InpatientAdmission",
  "Department",
  "Appointment",
  "Payment",
  "PatientBills",
  "LabTest",
  "LabUnit",
  "MedicalRecords",
  "VitalSigns",
  "Diagnosis",
  "AuditLog",
  "Notification",
  "SiteSettings",
  "Rating",
  "Services",
  "DoctorSpecialization",
  "Prescription",
  "PrescriptionItem",
  "MedicationAdministration",
]);

function withHospitalWhere(args: any, hospitalId: number) {
  const where = args?.where ?? {};
  if (where?.hospital_id != null) return args;
  return {
    ...args,
    where: {
      AND: [{ hospital_id: hospitalId }, where],
    },
  };
}

function withHospitalData(args: any, hospitalId: number) {
  const data = args?.data;
  if (!data) return args;
  if (Array.isArray(data)) {
    return {
      ...args,
      data: data.map((row) => (row?.hospital_id == null ? { ...row, hospital_id: hospitalId } : row)),
    };
  }
  if (data?.hospital_id != null) return args;
  return { ...args, data: { ...data, hospital_id: hospitalId } };
}

db.$use(async (params, next) => {
  const model = params.model;
  if (!model) return next(params);

  if (model === "Hospital" || model === "Plan") return next(params);

  if (!tenantScopedModels.has(model)) return next(params);

  if (await isMasterAdminRequest()) return next(params);

  const hospitalId = await resolveHospitalIdFromRequest();

  if (params.action === "create" || params.action === "createMany") {
    params.args = withHospitalData(params.args, hospitalId);
    return next(params);
  }

  if (
    params.action === "findMany" ||
    params.action === "findFirst" ||
    params.action === "findFirstOrThrow" ||
    params.action === "count" ||
    params.action === "aggregate" ||
    params.action === "groupBy"
  ) {
    params.args = withHospitalWhere(params.args, hospitalId);
    return next(params);
  }

  if (params.action === "findUnique" || params.action === "findUniqueOrThrow") {
    const action = params.action === "findUnique" ? "findFirst" : "findFirstOrThrow";
    return next({ ...params, action, args: withHospitalWhere(params.args, hospitalId) });
  }

  if (params.action === "update") {
    const scopedWhere = withHospitalWhere({ where: params.args?.where }, hospitalId).where;
    await next({
      ...params,
      action: "updateMany",
      args: { where: scopedWhere, data: params.args?.data ?? {} },
    });
    return next({
      ...params,
      action: "findFirstOrThrow",
      args: {
        where: scopedWhere,
        select: params.args?.select,
        include: params.args?.include,
      },
    });
  }

  if (params.action === "delete") {
    const scopedWhere = withHospitalWhere({ where: params.args?.where }, hospitalId).where;
    const existing = await next({
      ...params,
      action: "findFirstOrThrow",
      args: {
        where: scopedWhere,
        select: params.args?.select,
        include: params.args?.include,
      },
    });
    await next({
      ...params,
      action: "deleteMany",
      args: { where: scopedWhere },
    });
    return existing;
  }

  if (params.action === "updateMany" || params.action === "deleteMany") {
    params.args = withHospitalWhere(params.args, hospitalId);
    return next(params);
  }

  return next(params);
});

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
