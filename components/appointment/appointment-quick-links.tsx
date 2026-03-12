import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const AppointmentQuickLinks = async ({ staffId: _staffId }: { staffId: string }) => {
  return (
    <Card className="w-full rounded-xl bg-white shadow-none">
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link
          href="?cat=charts"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600"
        >
          Charts
        </Link>
        <Link
          href="?cat=appointments"
          className="px-4 py-2 rounded-lg bg-violet-100 text-violet-600"
        >
          Appointments
        </Link>

        <Link
          href="?cat=diagnosis"
          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600"
        >
          Diagnosis
        </Link>

        <Link
          href="?cat=bills"
          className="px-4 py-2 rounded-lg bg-green-100 text-green-600"
        >
          Bills
        </Link>

        <Link
          href="?cat=medical-history"
          className="px-4 py-2 rounded-lg bg-red-100 text-red-600"
        >
          Medical History
        </Link>

        <Link
          href="?cat=payments"
          className="px-4 py-2 rounded-lg bg-purple-100 text-purple-600"
        >
          Payments
        </Link>

        <Link
          href="?cat=lab-test"
          className="px-4 py-2 rounded-lg bg-purple-100 text-purple-600"
        >
          Lab Test
        </Link>

        <Link
          href="?cat=prescriptions"
          className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-600"
        >
          Prescriptions
        </Link>

        <Link
          href="?cat=appointments#vital-signs"
          className="px-4 py-2 rounded-lg bg-purple-100 text-purple-600"
        >
          Vital Signs
        </Link>

      </CardContent>
    </Card>
  );
};

export default AppointmentQuickLinks;
