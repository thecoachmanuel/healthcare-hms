import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const SettingsQuickLinks = () => {
  return (
    <Card className="w-full rounded-xl bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg text-gray-500">Quick Links</CardTitle>
      </CardHeader>

      <CardContent className="text-sm font-normal flex flex-wrap gap-4">
        <Link
          href="?cat=services"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600"
        >
          Services
        </Link>
        <Link
          href="?cat=lab-tests"
          className="px-4 py-2 rounded-lg bg-violet-100 text-violet-600"
        >
          Lab Tests
        </Link>

        <Link
          href="?cat=medications"
          className="px-4 py-2 rounded-lg bg-rose-100 text-rose-600"
        >
          Medications
        </Link>

        <Link
          href="?cat=lab-units"
          className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-600"
        >
          Lab Units
        </Link>

        <Link
          href="?cat=specializations"
          className="px-4 py-2 rounded-lg bg-orange-100 text-orange-600"
        >
          Doctor Specializations
        </Link>

        <Link
          href="?cat=site"
          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600"
        >
          Site
        </Link>
      </CardContent>
    </Card>
  );
};
