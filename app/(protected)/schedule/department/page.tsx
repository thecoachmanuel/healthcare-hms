import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { DepartmentSchedule } from "@/components/schedule/department-schedule";

export default async function DepartmentSchedulePage() {
  const userId = await requireAuthUserId();
  const [staff, departments] = await Promise.all([
    db.staff.findUnique({ where: { id: userId }, select: { department: true } }),
    db.department.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  const dept = staff?.department?.trim() ?? "";
  const options = [{ label: "Select department", value: "" }, ...departments.map((d) => ({ label: d.name, value: d.name }))];
  return (
    <div className="p-6">
      <DepartmentSchedule initialDepartment={dept} options={options} />
    </div>
  );
}
