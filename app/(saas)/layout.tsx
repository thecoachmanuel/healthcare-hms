import Link from "next/link";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/saas" className="text-base font-semibold">
              Agency Console
            </Link>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <Link href="/saas" className="hover:text-slate-900">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/agency" className="hover:text-slate-900">
                Landing
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/hospital-signup">
              <Button size="sm" variant="outline">
                Create hospital
              </Button>
            </Link>
            <Link href="/saas/login">
              <Button size="sm">Switch account</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
