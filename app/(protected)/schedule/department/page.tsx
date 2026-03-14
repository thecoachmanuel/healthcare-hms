import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { DepartmentSchedule } from "@/components/schedule/department-schedule";

export default async function DepartmentSchedulePage() {
  const userId = await requireAuthUserId();
  const staff = await db.staff.findUnique({ where: { id: userId }, select: { department: true } });
  const dept = staff?.department?.trim() ?? "";
  return (
    <div className="p-6">
      <DepartmentSchedule initialDepartment={dept} />
    </div>
  );
}

