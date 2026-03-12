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
