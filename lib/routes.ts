type RouteAccessProps = {
  [key: string]: string[];
};

export const routeAccess: RouteAccessProps = {
  "/admin(.*)": ["admin"],
  "/patient(.*)": ["patient", "admin", "doctor", "nurse", "record_officer"],
  "/doctor(.*)": ["doctor"],
  "/staff(.*)": ["nurse", "lab_scientist", "lab_technician", "cashier", "pharmacist"],
  "/receptionist(.*)": ["receptionist"],
  "/lab_receptionist(.*)": ["lab_receptionist"],
  "/medications(.*)": ["patient", "admin", "doctor", "nurse", "pharmacist"],
  "/nurse(.*)": ["nurse"],
  "/lab_scientist(.*)": ["lab_scientist", "lab_technician", "lab_receptionist"],
  "/lab_technician(.*)": ["lab_scientist", "lab_technician", "lab_receptionist"],
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
  "/record/appointments": ["admin", "doctor", "nurse", "patient", "lab_scientist", "lab_technician", "lab_receptionist", "cashier", "pharmacist", "record_officer", "receptionist"],
  "/record/appointments(.*)": ["admin", "doctor", "nurse", "patient", "lab_scientist", "lab_technician", "lab_receptionist", "cashier", "pharmacist", "record_officer", "receptionist"],
  "/record/medical-records": ["admin", "doctor", "nurse", "record_officer"],
  "/record/billing": ["admin", "cashier", "doctor", "nurse", "lab_scientist", "lab_technician", "pharmacist"],
  "/record/payments": ["admin", "cashier"],
  "/patient/registration": ["patient"],
  "/notifications": ["admin", "doctor", "nurse", "lab_scientist", "lab_technician", "lab_receptionist", "cashier", "patient", "record_officer", "receptionist"],
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
