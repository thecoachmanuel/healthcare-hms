import { getRole } from "@/utils/roles";
import db, { resolveHospitalIdFromRequest } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileSignature,
  FileText,
  FlaskConical,
  HandCoins,
  HeartPulse,
  LayoutDashboard,
  Logs,
  LucideIcon,
  FolderOpen,
  Pill,
  ScrollText,
  Settings,
  SquareActivity,
  Stethoscope,
  Syringe,
  UserCog,
  User,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { LogoutButton } from "./logout-button";

const ACCESS_LEVELS_ALL = [
  "admin",
  "doctor",
  "nurse",
  "lab_scientist",
  "lab_technician",
  "lab_receptionist",
  "cashier",
  "pharmacist",
  "patient",
  "record_officer",
  "receptionist",
];

const SidebarIcon = ({ icon: Icon }: { icon: LucideIcon }) => {
  return <Icon className="size-6 lg:size-5" />;
};

export const Sidebar = async () => {
  const role = await getRole();
  const hospitalId = await resolveHospitalIdFromRequest();
  const now = new Date();
  const [activeSub, hospital] = await Promise.all([
    db.subscription.findFirst({
      where: { hospital_id: hospitalId, status: SubscriptionStatus.ACTIVE, current_period_end: { gt: now } },
      select: { id: true },
    }),
    db.hospital.findFirst({ where: { id: hospitalId }, select: { trial_ends_at: true } }),
  ]);
  const trialActive = hospital?.trial_ends_at ? hospital.trial_ends_at.getTime() > now.getTime() : false;
  const locked = !activeSub && !trialActive;

  const SIDEBAR_LINKS = [
    {
      label: "MENU",
      links: [
        {
          name: "Dashboard",
          href: "/",
          access: ACCESS_LEVELS_ALL,
          icon: LayoutDashboard,
        },
        {
          name: "Profile",
          href: "/patient/self",
          access: ["patient"],
          icon: User,
        },
      ],
    },
    {
      label: "Manage",
      links: [
        {
          name: "Users",
          href: "/record/users",
          access: ["admin"],
          icon: Users,
        },
        {
          name: "Doctors",
          href: "/record/doctors",
          access: ["admin"],
          icon: Stethoscope,
        },
        {
          name: "Staffs",
          href: "/record/staffs",
          access: ["admin", "doctor"],
          icon: UserRound,
        },
        {
          name: "Patients",
          href: "/record/patients",
          access: ["admin", "doctor", "nurse", "record_officer"],
          icon: UsersRound,
        },
        {
          name: "Appointments",
          href: "/record/appointments",
          access: ["admin", "doctor", "nurse", "lab_scientist", "lab_technician", "lab_receptionist", "cashier", "pharmacist", "receptionist"],
          icon: CalendarDays,
        },
        {
          name: "Medical Records",
          href: "/record/medical-records",
          access: ["admin", "doctor", "nurse"],
          icon: HeartPulse,
        },
        {
          name: "Lab Tests",
          href: "/lab_scientist/lab-tests",
          access: ["lab_scientist", "lab_technician", "lab_receptionist"],
          icon: FlaskConical,
        },
        {
          name: "Billing Overview",
          href: "/record/billing",
          access: ["admin", "doctor", "cashier", "nurse", "lab_scientist", "lab_technician", "pharmacist"],
          icon: FileText,
        },
        {
          name: "Payments",
          href: "/record/payments",
          access: ["admin", "cashier"],
          icon: HandCoins,
        },
        {
          name: "Prescriptions",
          href: "/pharmacist/prescriptions",
          access: ["pharmacist"],
          icon: FileSignature,
        },
        {
          name: "Medications",
          href: "/pharmacist/medications",
          access: ["pharmacist"],
          icon: Pill,
        },
        {
          name: "Patient Management",
          href: "/nurse/patient-management",
          access: ["nurse"],
          icon: UserCog,
        },
        {
          name: "Lab Tests",
          href: "/nurse/lab-tests",
          access: ["nurse"],
          icon: FlaskConical,
        },
        {
          name: "Administer Medications",
          href: "/nurse/administer-medications",
          access: ["admin", "doctor", "nurse"],
          icon: Syringe,
        },
        {
          name: "Appointments",
          href: "/record/appointments",
          access: ["patient"],
          icon: CalendarDays,
        },
        {
          name: "Records",
          href: "/patient/self",
          access: ["patient"],
          icon: FolderOpen,
        },
        {
          name: "Prescription",
          href: "/patient/prescriptions",
          access: ["patient"],
          icon: ScrollText,
        },
        {
          name: "Record Officer",
          href: "/record_officer",
          access: ["record_officer"],
          icon: ClipboardList,
        },
        {
          name: "Billing",
          href: "/patient/self?cat=payments",
          access: ["patient"],
          icon: CreditCard,
        },
      ],
    },
    {
      label: "System",
      links: [
        {
          name: "Notifications",
          href: "/notifications",
          access: ACCESS_LEVELS_ALL,
          icon: Bell,
        },
        {
          name: "Audit Logs",
          href: "/admin/audit-logs",
          access: ["admin"],
          icon: Logs,
        },
        {
          name: "Settings",
          href: "/admin/system-settings",
          access: ["admin"],
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="w-full p-4 flex flex-col justify-between gap-4 bg-white overflow-y-scroll min-h-full">
      <div className="">
        <div className="flex items-center justify-center lg:justify-start gap-2">
          <div className="p-1.5 rounded-md bg-blue-600 text-white">
            <SquareActivity size={22} />
          </div>
          <Link
            href={"/"}
            className="hidden lg:flex text-base 2xl:text-xl font-bold"
          >
            Healthcare HMS
          </Link>
        </div>

        {locked ? (
          <div className="mt-4 text-xs">
            <div className="rounded-md border p-3 text-center bg-amber-50 text-amber-800">
              Subscription inactive. <Link className="underline" href="/subscription">Subscribe</Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm">
            {SIDEBAR_LINKS.map((el) => (
              <div key={el.label} className="flex flex-col gap-2">
                <span className="hidden uppercase lg:block text-gray-400 font-bold my-4">
                  {el.label}
                </span>

                {el.links.map((link) => {
                  if (link.access.includes(role.toLowerCase())) {
                    return (
                      <Link
                        href={link.href}
                        className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-blue-600/10"
                        key={link.name}
                      >
                        <SidebarIcon icon={link.icon} />
                        <span className="hidden lg:block">{link.name}</span>
                      </Link>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <LogoutButton />
    </div>
  );
};
