import db from "@/lib/db";

export async function getAllStaff({
  page,
  limit,
  search,
  role,
  department,
  unitId,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
  department?: string;
  unitId?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;
    const q = (search ?? "").trim();
    const dept = (department ?? "").trim();
    const unit = (unitId ?? "").trim();

    const where: any = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role ? { role: role as any } : {},
        dept ? { department: { contains: dept, mode: "insensitive" } } : {},
        unit ? { lab_unit_id: Number(unit) } : {},
      ],
    };

    const [staff, totalRecords, statusCounts, roleCounts] = await Promise.all([
      db.staff.findMany({
        where,

        skip: SKIP,
        take: LIMIT,
      }),
      db.staff.count({
        where,
      }),
      (db as any).staff.groupBy({
        by: ["status"],
        _count: { _all: true },
        where,
      }),
      (db as any).staff.groupBy({
        by: ["role"],
        _count: { _all: true },
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data: staff,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      stats: {
        statusCounts: (statusCounts ?? []).map((r: any) => ({
          status: String(r.status),
          count: Number(r._count?._all ?? 0),
        })),
        roleCounts: (roleCounts ?? []).map((r: any) => ({
          role: String(r.role),
          count: Number(r._count?._all ?? 0),
        })),
      },
      status: 200,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}
