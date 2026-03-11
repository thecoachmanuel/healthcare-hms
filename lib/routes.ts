type RouteAccessProps = {
  [key: string]: string[];
};

export const routeAccess: RouteAccessProps = {
  "/admin(.*)": ["admin"],
  "/patient(.*)": ["patient", "admin", "doctor", "nurse"],
  "/doctor(.*)": ["doctor"],
  "/staff(.*)": ["nurse", "lab_scientist", "lab_technician", "cashier"],
  "/nurse(.*)": ["nurse"],
  "/lab_scientist(.*)": ["lab_scientist", "lab_technician"],
  "/lab_technician(.*)": ["lab_scientist", "lab_technician"],
  "/cashier(.*)": ["cashier"],
  "/record/users": ["admin"],
  "/record/doctors": ["admin"],
  "/record/doctors(.*)": ["admin", "doctor"],
  "/record/staffs": ["admin", "doctor"],
  "/record/patients": ["admin", "doctor", "nurse"],
  "/record/appointments": ["admin", "doctor", "nurse", "patient"],
  "/record/appointments(.*)": ["admin", "doctor", "nurse", "patient"],
  "/record/medical-records": ["admin", "doctor", "nurse"],
  "/record/billing": ["admin", "doctor"],
  "/patient/registration": ["patient"],
  "/notifications": ["admin", "doctor", "nurse", "lab_scientist", "lab_technician", "cashier", "patient"],
};

// import { createRouteMatcher } from "@clerk/nextjs/server";

// export const routeMatchers = {
//   admin: createRouteMatcher([
//     "/admin(.*)",
//     "/patient(.*)",
//     "/record/users",
//     "/record/doctors(.*)",
//     "/record/patients",
//     "/record/doctors",
//     "/record/staffs",
//     "/record/patients",
//   ]),
//   patient: createRouteMatcher(["/patient(.*)", "/patient/registrations"]),

//   doctor: createRouteMatcher([
//     "/doctor(.*)",
//     "/record/doctors(.*)",
//     "/record/patients",
//     "/patient(.*)",
//     "/record/staffs",
//     "/record/patients",
//   ]),
// };
