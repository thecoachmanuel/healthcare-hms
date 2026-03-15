import { getRole } from "@/utils/roles";
import db from "@/lib/db";
import { unstable_cache } from "next/cache";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  CalendarCheck,
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
  BookOpen,
  Pill,
  ScrollText,
  Settings,
  SquareActivity,
  Stethoscope,
  Syringe,
  Receipt,
  UserCog,
  User,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { LogoutButton } from "./logout-button";

const getSiteSettings = unstable_cache(
  async () =>
    db.siteSettings.findFirst({
      orderBy: { id: "asc" },
      select: { site_name: true, logo_url: true },
    }),
  ["site-settings"],
  { tags: ["site-settings"] }
);

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
  const settings = await getSiteSettings();
  const siteName = (settings?.site_name ?? "").trim();
  const siteLogoUrl = (settings?.logo_url ?? "").trim();
  const displaySiteName = siteName.length > 0 ? siteName : "Healthcare HMS";

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
          name: "HMO Providers",
          href: "/admin/hmo-providers",
          access: ["admin"],
          icon: FolderOpen,
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
          name: "Doctor Availability",
          href: "/schedule/doctor-availability",
          access: ["admin", "receptionist"],
          icon: CalendarClock,
        },
        {
          name: "Department Schedule",
          href: "/schedule/department",
          access: ["admin", "receptionist"],
          icon: CalendarRange,
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
          href: role.toLowerCase() === "cashier" ? "/cashier/finance/payments" : "/record/payments",
          access: ["admin", "cashier"],
          icon: HandCoins,
        },
        {
          name: "HMO / Insurance",
          href: "/record/insurance",
          access: ["admin", "cashier"],
          icon: CreditCard,
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
          name: "My Availability",
          href: "/doctor/availability",
          access: ["doctor"],
          icon: CalendarCheck,
        },
        {
          name: "Records",
          href: "/patient/self",
          access: ["patient"],
          icon: BookOpen,
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
          icon: Receipt,
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
    <div className="w-full p-4 flex flex-col justify-between gap-4 bg-white min-h-full" id="app-sidebar">
      <div className="">
        <div className="flex items-center justify-center lg:justify-start gap-2">
          <div className="p-1.5 rounded-md bg-blue-600 text-white">
            {siteLogoUrl.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteLogoUrl} alt={displaySiteName} className="size-[22px] object-contain" />
            ) : (
              <SquareActivity size={22} />
            )}
          </div>
          <Link href={"/"} className="hidden lg:flex text-base 2xl:text-xl font-bold">
            {displaySiteName}
          </Link>
        </div>

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
                      <span className="sidebar-label hidden lg:block">{link.name}</span>
                    </Link>
                  );
                }
              })}
            </div>
          ))}
        </div>
      </div>

      <LogoutButton />
    </div>
  );
};
