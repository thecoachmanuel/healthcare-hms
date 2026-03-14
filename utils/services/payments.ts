import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getPaymentRecords({
  page,
  limit,
  search,
  status,
  coverage,
  method,
  from,
  to,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  coverage?: string;
  method?: string;
  from?: string;
  to?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const dateFilter =
      (from || to)
        ? {
            payment_date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const where: Prisma.PaymentWhereInput = {
      AND: [
        dateFilter,
        status ? { status: status as any } : {},
        coverage ? { coverage_type: coverage as any } : {},
        method ? { payment_method: method as any } : {},
        search
          ? {
              OR: [
                { patient: { first_name: { contains: search, mode: "insensitive" } } },
                { patient: { last_name: { contains: search, mode: "insensitive" } } },
                { patient: { hospital_number: { contains: search, mode: "insensitive" } } },
                { receipt_number: isNaN(Number(search)) ? undefined : Number(search) },
              ].filter(Boolean) as any,
            }
          : {},
      ],
    };

    const [data, totalRecords] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          patient: {
            select: {
              first_name: true,
              last_name: true,
              date_of_birth: true,
              img: true,
              colorCode: true,
              gender: true,
            },
          },
        },
        skip: SKIP,
        take: LIMIT,
        orderBy: { created_at: "desc" },
      }),
      db.payment.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getInsurancePatients({
  page,
  limit,
  search,
  coverage,
  provider,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  coverage?: string;
  provider?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;
    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const patientWhere: Prisma.PatientWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { hospital_number: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        provider
          ? { insurance_provider: { contains: provider, mode: "insensitive" } }
          : {},
        {
          OR: [
            { insurance_provider: { not: null } },
            { insurance_number: { not: null } },
            coverage
              ? {
                  payments: {
                    some: {
                      coverage_type: coverage as any,
                    },
                  },
                }
              : {
                  payments: {
                    some: {
                      coverage_type: { not: "NONE" as any },
                    },
                  },
                },
          ],
        },
      ],
    };

    const [patients, totalRecords] = await Promise.all([
      db.patient.findMany({
        where: patientWhere,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          hospital_number: true,
          phone: true,
          email: true,
          insurance_provider: true,
          insurance_number: true,
        },
        orderBy: { created_at: "desc" },
        skip: SKIP,
        take: LIMIT,
      }),
      db.patient.count({ where: patientWhere }),
    ]);

    const ids = patients.map((p) => p.id);

    const coverageWhere: Prisma.PaymentWhereInput = {
      patient_id: { in: ids.length ? ids : ["__none__"] },
      coverage_type: coverage
        ? (coverage as any)
        : ({ not: "NONE" } as any),
    };

    const aggregates = ids.length
      ? await db.payment.groupBy({
          by: ["patient_id"],
          where: coverageWhere,
          _sum: {
            total_amount: true,
            amount_paid: true,
            discount: true,
          },
          _max: {
            payment_date: true,
          },
        })
      : [];

    const aggMap = new Map(
      aggregates.map((a) => [a.patient_id, a])
    );

    const rows = patients.map((p) => {
      const agg = aggMap.get(p.id);
      const totalAmount = Number(agg?._sum.total_amount ?? 0);
      const totalPaid = Number(agg?._sum.amount_paid ?? 0);
      const totalDiscount = Number(agg?._sum.discount ?? 0);
      const unpaid = Math.max(0, totalAmount - totalPaid - totalDiscount);

      return {
        patient_id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        hospital_number: p.hospital_number,
        phone: p.phone,
        email: p.email,
        insurance_provider: p.insurance_provider,
        insurance_number: p.insurance_number,
        total_amount: totalAmount,
        total_paid: totalPaid,
        total_discount: totalDiscount,
        total_unpaid: unpaid,
        last_payment_date: agg?._max.payment_date ?? null,
      };
    });

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data: rows,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getInsuranceClaims({
  page,
  limit,
  search,
  status,
  coverage,
  from,
  to,
  provider,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  coverage?: string;
  from?: string;
  to?: string;
  provider?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;
    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const dateFilter =
      from || to
        ? {
            bill_date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const where: Prisma.PaymentWhereInput = {
      AND: [
        { coverage_type: { not: "NONE" as any } },
        dateFilter,
        status ? { status: status as any } : {},
        coverage ? { coverage_type: coverage as any } : {},
        provider
          ? { patient: { insurance_provider: { contains: provider, mode: "insensitive" } } }
          : {},
        search
          ? {
              OR: [
                { patient: { first_name: { contains: search, mode: "insensitive" } } },
                { patient: { last_name: { contains: search, mode: "insensitive" } } },
                { patient: { hospital_number: { contains: search, mode: "insensitive" } } },
                { receipt_number: isNaN(Number(search)) ? undefined : Number(search) },
              ].filter(Boolean) as any,
            }
          : {},
      ],
    };

    const [data, totalRecords] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          patient: {
            select: {
              first_name: true,
              last_name: true,
              hospital_number: true,
              insurance_provider: true,
              insurance_number: true,
            },
          },
        },
        orderBy: { bill_date: "desc" },
        skip: SKIP,
        take: LIMIT,
      }),
      db.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getDistinctInsuranceProviders() {
  try {
    const rows = await db.patient.findMany({
      where: { insurance_provider: { not: null } },
      select: { insurance_provider: true },
      distinct: ["insurance_provider"],
      orderBy: { insurance_provider: "asc" },
    });
    const patientProviders = rows
      .map((r) => r.insurance_provider as string)
      .filter((v) => !!v && v.trim().length > 0);

    const providerRows = await db.hmoProvider.findMany({
      where: { active: true },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    const adminProviders = providerRows.map((p) => p.name).filter((v) => !!v && v.trim().length > 0);

    const all = Array.from(new Set([...adminProviders, ...patientProviders])).sort((a, b) => a.localeCompare(b));
    return all;
  } catch (error) {
    console.log(error);
    return [] as string[];
  }
}
