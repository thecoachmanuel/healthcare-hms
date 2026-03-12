type RouteAccessProps = {
  [key: string]: string[];
};

export const routeAccess: RouteAccessProps = {
  "/admin(.*)": ["admin"],
  "/patient(.*)": ["patient", "admin", "doctor", "nurse"],
  "/doctor(.*)": ["doctor"],
  "/staff(.*)": ["nurse", "lab_scientist", "lab_technician", "cashier", "pharmacist"],
  "/medications(.*)": ["patient", "admin", "doctor", "nurse", "pharmacist"],
  "/nurse(.*)": ["nurse"],
  "/lab_scientist(.*)": ["lab_scientist", "lab_technician"],
  "/lab_technician(.*)": ["lab_scientist", "lab_technician"],
  "/cashier(.*)": ["cashier"],
  "/pharmacist(.*)": ["pharmacist"],
  "/record_officer(.*)": ["record_officer"],
  "/record/users": ["admin"],
  "/record/doctors": ["admin"],
  "/record/doctors(.*)": ["admin", "doctor"],
  "/record/staffs": ["admin", "doctor"],
  "/record/staffs(.*)": ["admin"],
  "/record/patients": ["admin", "doctor", "nurse", "record_officer"],
  "/record/patients(.*)": ["admin", "record_officer"],
  "/record/appointments": ["admin", "doctor", "nurse", "patient", "lab_scientist", "lab_technician", "cashier", "pharmacist", "record_officer"],
  "/record/appointments(.*)": ["admin", "doctor", "nurse", "patient", "lab_scientist", "lab_technician", "cashier", "pharmacist", "record_officer"],
  "/record/medical-records": ["admin", "doctor", "nurse", "record_officer"],
  "/record/billing": ["admin", "cashier", "doctor", "nurse", "lab_scientist", "lab_technician", "pharmacist"],
  "/record/payments": ["admin", "cashier"],
  "/patient/registration": ["patient"],
  "/notifications": ["admin", "doctor", "nurse", "lab_scientist", "lab_technician", "cashier", "patient", "record_officer"],
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
