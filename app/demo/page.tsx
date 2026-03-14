"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const accounts: { role: string; email: string; password: string; description: string }[] = [
  { role: "Admin", email: "admin@lasuth.org.ng", password: "lasuth2026", description: "Full access. Manage users, departments, settings, reports." },
  { role: "Doctor", email: "doctor1@lasuth.org.ng", password: "lasuth2026", description: "Consults, updates records, orders labs, prescribes." },
  { role: "Nurse", email: "nurse1@lasuth.org.ng", password: "lasuth2026", description: "Record vitals, administer medications, manage inpatients." },
  { role: "Lab Scientist", email: "labscientist1@lasuth.org.ng", password: "lasuth2026", description: "Process samples, manage tests, approve results." },
  { role: "Cashier", email: "cashier1@lasuth.org.ng", password: "lasuth2026", description: "Billing, receipts, payments and coverage." },
  { role: "Pharmacist", email: "pharmacist1@lasuth.org.ng", password: "lasuth2026", description: "Dispense prescriptions and manage stock (demo)." },
  { role: "Record Officer", email: "record1@lasuth.org.ng", password: "lasuth2026", description: "Register patients, manage records and charts." },
  { role: "Receptionist", email: "reception1@lasuth.org.ng", password: "lasuth2026", description: "Schedule appointments and route patients." },
  { role: "Lab Receptionist", email: "labreception1@lasuth.org.ng", password: "lasuth2026", description: "Receive samples and route to lab units." },
  { role: "Patient", email: "patient1@lasuth.org.ng", password: "lasuth2026", description: "Access personal records, prescriptions, and appointments." },
];

export default function DemoPage() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  const flowReceptionistBook = async () => {
    const email = "reception1@lasuth.org.ng";
    const password = "lasuth2026";
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    const res = await fetch("/api/demo/book-appointment", { method: "POST" });
    const out = await res.json();
    if (!out.success) {
      toast.error(out.message ?? "Failed to book demo appointment");
      return;
    }
    toast.success("Appointment booked");
    router.replace(`/record/appointments/${out.appointmentId}`);
  };

  const flowCashierPay = async () => {
    const email = "cashier1@lasuth.org.ng";
    const password = "lasuth2026";
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    const res = await fetch("/api/demo/complete-billing", { method: "POST" });
    const out = await res.json();
    if (!out.success) {
      toast.error(out.message ?? "Failed to complete billing");
      return;
    }
    toast.success("Payment completed");
    router.replace(`/record/billing`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Healthcare HMS Demo</h1>
          <p className="mt-3 text-gray-600">Sign in with a preloaded role and explore a fully seeded environment.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => (
            <Card key={acc.email} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{acc.role}</CardTitle>
                <CardDescription>{acc.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="text-gray-500">Email</div>
                  <div className="font-mono text-[13px]">{acc.email}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Password</div>
                  <div className="font-mono text-[13px]">{acc.password}</div>
                </div>
                <Button className="w-full bg-blue-600" onClick={() => handleLogin(acc.email, acc.password)}>
                  Sign in as {acc.role}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Demo Highlights</CardTitle>
              <CardDescription>Pre-seeded data covers the end-to-end hospital workflow.</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-5">
                <li>Departments, wards, and lab units</li>
                <li>Doctors with working schedules</li>
                <li>30+ patients with demographics</li>
                <li>Appointments with day/week schedule views</li>
                <li>Payments, invoices, and coverage types</li>
                <li>Prescriptions, dispensing, and administrations</li>
                <li>Lab tests lifecycle from request to approval</li>
                <li>Inpatient admissions and discharge records</li>
                <li>Audit logs and basic notifications</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Navigate common demo scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Link className="text-blue-600 hover:underline" href="/record/appointments">Appointments</Link>
                <Link className="text-blue-600 hover:underline" href="/schedule/department">Department Schedule</Link>
                <Link className="text-blue-600 hover:underline" href="/nurse/administer-medications">Medication Administration</Link>
                <Link className="text-blue-600 hover:underline" href="/lab_scientist/lab-tests">Lab Tests</Link>
                <Link className="text-blue-600 hover:underline" href="/record/billing">Billing</Link>
                <Link className="text-blue-600 hover:underline" href="/record/patients">Patients</Link>
                <Link className="text-blue-600 hover:underline" href="/record/doctors">Doctors</Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scripted Flows</CardTitle>
              <CardDescription>One‑click demos that perform typical tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-emerald-600" onClick={flowReceptionistBook}>Book Appointment (Receptionist)</Button>
              <Button className="w-full bg-emerald-600" onClick={flowCashierPay}>Complete Billing (Cashier)</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
