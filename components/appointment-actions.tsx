import { checkRole } from "@/utils/roles";
import { requireAuthUserId } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { EllipsisVertical, User } from "lucide-react";
import Link from "next/link";
import { AppointmentActionDialog } from "./appointment-action-dialog";

interface ActionsProps {
  userId: string;
  status: string;
  patientId: string;
  doctorId: string;
  appointmentId: number;
}

export const AppointmentActionOptions = async ({
  userId,
  patientId,
  doctorId,
  status,
  appointmentId,
}: ActionsProps) => {
  const currentUserId = await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center rounded-full p-1"
        >
          <EllipsisVertical size={16} className="text-sm text-gray-500" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-3">
        <div className="space-y-3 flex flex-col items-start">
          <span className="text-gray-400 text-xs">Perform Actions</span>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href={`/record/appointments/${appointmentId}`}>
              <User size={16} /> View Full Details
            </Link>
          </Button>

          {status !== "SCHEDULED" && (
            <AppointmentActionDialog
              type="approve"
              id={appointmentId}
              disabled={isAdmin || currentUserId === doctorId}
            />
          )}
          <AppointmentActionDialog
            type="cancel"
            id={appointmentId}
            disabled={
              status === "PENDING" &&
              (isAdmin || currentUserId === doctorId || currentUserId === patientId)
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
