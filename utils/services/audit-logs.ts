import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getAuditLogs({
  page,
  limit,
  search,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
}) {
  const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
  const LIMIT = Number(limit) || 10;
  const SKIP = (PAGE_NUMBER - 1) * LIMIT;

  const where: Prisma.AuditLogWhereInput = search
    ? {
        OR: [
          { user_id: { contains: search, mode: "insensitive" } },
          { record_id: { contains: search, mode: "insensitive" } },
          { action: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { details: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, totalRecords] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: SKIP,
      take: LIMIT,
    }),
    db.auditLog.count({ where }),
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
}

