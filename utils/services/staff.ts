import db from "@/lib/db";

export async function getAllStaff({
  page,
  limit,
  search,
  role,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
}) {
  try {
    const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
    const LIMIT = Number(limit) || 10;

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;

    const [staff, totalRecords] = await Promise.all([
      db.staff.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
            role ? { role: role as any } : {},
          ],
        },

        skip: SKIP,
        take: LIMIT,
      }),
      db.staff.count({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
            role ? { role: role as any } : {},
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / LIMIT);

    return {
      success: true,
      data: staff,
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
