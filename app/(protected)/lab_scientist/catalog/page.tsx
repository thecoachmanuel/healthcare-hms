import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { checkRole } from "@/utils/roles";
import { AddService } from "@/components/dialogs/add-service";
import { approveLabTestService } from "@/app/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LabCatalogPage() {
  const userId = await requireAuthUserId();
  const [isScientist, isTechnician, isReceptionist] = await Promise.all([
    checkRole("LAB_SCIENTIST" as any),
    checkRole("LAB_TECHNICIAN" as any),
    checkRole("LAB_RECEPTIONIST" as any),
  ]);

  const staff = await db.staff.findUnique({ where: { id: userId }, select: { lab_unit_id: true } });
  const unitId = staff?.lab_unit_id ?? null;
  const unit = unitId ? await db.labUnit.findUnique({ where: { id: unitId }, select: { id: true, name: true } }) : null;

  const [approved, pending, units] = await Promise.all([
    db.services.findMany({
      where: { category: "LAB_TEST" as any, approved: true, ...(unitId ? { lab_unit_id: unitId } : {}) },
      orderBy: { service_name: "asc" },
      select: { id: true, service_name: true, description: true, price: true, lab_unit_id: true },
    }),
    isScientist
      ? db.services.findMany({
          where: {
            category: "LAB_TEST" as any,
            approved: false,
            ...(unitId ? { lab_unit_id: unitId } : {}),
          },
          orderBy: { service_name: "asc" },
          select: { id: true, service_name: true, description: true, price: true, lab_unit_id: true, created_by_role: true },
        })
      : Promise.resolve([] as any[]),
    db.labUnit.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  const unitOptions = units.map((u: any) => ({ label: u.name, value: String(u.id) }));
  const filteredUnitOptions = unitId ? unitOptions.filter((u: any) => Number(u.value) === unitId) : unitOptions;

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-none rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lab Test Catalog</CardTitle>
            <CardDescription>
              {unit ? `Approved tests for ${unit.name} unit` : "Approved lab tests"}
            </CardDescription>
          </div>
          {(isScientist || isTechnician || isReceptionist) && (
            <AddService
              category="LAB_TEST"
              buttonText="Add Lab Test"
              title="Add Lab Test"
              description="Create a lab test under your unit."
              labUnits={filteredUnitOptions}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Price</th>
                  <th className="py-2 px-2 hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2">{s.service_name}</td>
                    <td className="py-2 px-2">{Number(s.price).toFixed(2)}</td>
                    <td className="py-2 px-2 hidden md:table-cell">{s.description}</td>
                  </tr>
                ))}
                {approved.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">No approved tests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isScientist && (
        <Card className="shadow-none rounded-xl">
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription>Approve tests created by technicians or receptionists in your unit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Price</th>
                    <th className="py-2 px-2 hidden md:table-cell">Created By</th>
                    <th className="py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2">{s.service_name}</td>
                      <td className="py-2 px-2">{Number(s.price).toFixed(2)}</td>
                      <td className="py-2 px-2 hidden md:table-cell">{String(s.created_by_role || "-")}</td>
                      <td className="py-2 px-2">
                        <form action={async () => { "use server"; await approveLabTestService(s.id); }}>
                          <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Approve</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">No pending items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

