import { Doctor, Patient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";
import { calculateAge } from "@/utils";
import { Calendar, Home, Info, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

export const PatientDetailsCard = ({
  patient,
  physician,
}: {
  patient: Patient;
  physician?: Doctor | null;
}) => {
  return (
    <Card className="shadow-none bg-white">
      <CardHeader>
        <CardTitle>Patient Details</CardTitle>
        <div className="relative size-20 xl:size-24 rounded-full overflow-hidden">
          <Image
            src={patient.img || "/user.jpg"}
            alt={patient?.first_name}
            width={100}
            height={100}
            className="rounded-full"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            {patient?.first_name} {patient?.last_name}
          </h2>
          <p className="text-sm text-gray-500">
            {patient?.email} - {patient?.phone}
          </p>
          <p className="text-sm text-gray-500">
            {patient?.gender} - {calculateAge(patient?.date_of_birth)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <Calendar size={22} className="text-0gray-400" />
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="text-base font-medium text-muted-foreground">
              {format(new Date(patient?.date_of_birth), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Home size={22} className="text-0gray-400" />
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-base font-medium text-muted-foreground">
              {patient?.address}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail size={22} className="text-0gray-400" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-base font-medium text-muted-foreground">
              {patient?.email}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Phone size={22} className="text-0gray-400" />
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-base font-medium text-muted-foreground">
              {patient?.phone}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Info size={22} className="text-0gray-400" />
          <div>
            <p className="text-sm text-gray-500">Physician</p>
            <p className="text-base font-medium text-muted-foreground">
              {physician
                ? `${physician.name}${physician.specialization ? ` — ${physician.specialization}` : ""}`
                : "Not assigned"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div>
            <p className="text-sm text-gray-500">Active Conditions</p>
            <p className="text-base font-medium text-muted-foreground">
              {patient?.medical_conditions}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div>
            <p className="text-sm text-gray-500">Allergies</p>
            <p className="text-base font-medium text-muted-foreground">
              {patient?.allergies}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
