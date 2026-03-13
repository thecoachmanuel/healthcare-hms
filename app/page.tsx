import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { getAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { headers } from "next/headers";
import AgencyLandingPage from "./agency/page";

function normalizeHost(raw: string | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function getBaseDomain(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim() ||
    process.env.BASE_DOMAIN?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  return fromEnv.toLowerCase();
}

function parseHospitalSlugFromHost(host: string, baseDomain: string): string | null {
  if (!host) return null;
  if (!baseDomain) return null;
  if (host === baseDomain) return null;
  const suffix = `.${baseDomain}`;
  if (!host.endsWith(suffix)) return null;
  const subdomain = host.slice(0, -suffix.length);
  if (!subdomain) return null;
  if (subdomain.includes(".")) return null;
  return subdomain;
}

export default async function Home() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("x-tenant-host") ?? headerStore.get("host"));
  const baseDomain = getBaseDomain();
  const tenantSlug = parseHospitalSlugFromHost(host, baseDomain);
  const isAgencyHost =
    host === "" ||
    host === baseDomain ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    (host === "localhost" && !tenantSlug);

  const userId = await getAuthUserId();

  if (userId) {
    const role = await getRole();
    if (role === "master_admin") redirect("/saas");
    if (!isAgencyHost) redirect(role === "sign-in" ? "/sign-in" : `/${role}`);
  }

  if (isAgencyHost) {
    return <AgencyLandingPage />;
  }

  const settings = await (async () => {
    try {
      return await db.siteSettings.findFirst({ orderBy: { id: "asc" } });
    } catch {
      return null;
    }
  })();
  const homepageTitle = settings?.homepage_title?.trim() || "Modern Hospital Management, Simplified";
  const homepageSubtitle = settings?.homepage_subtitle?.trim() || "";
  const homepageText =
    settings?.homepage_text?.trim() ||
    "Streamline appointments, clinical documentation, lab workflows, billing, and inpatient care in one secure system. Built for frontline teams and administrators to work faster, reduce errors, and deliver better patient outcomes.";
  const siteName = settings?.site_name?.trim() || "Healthcare HMS";
  const logoUrl = settings?.logo_url?.trim() || "";

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="flex flex-col items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={220}
                height={48}
                priority
                unoptimized
                loader={({ src }) => src}
                className="h-12 w-auto"
              />
            ) : null}
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              {homepageTitle}
            </h1>
            {homepageSubtitle ? (
              <p className="text-center text-gray-600 max-w-2xl">{homepageSubtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="text-center max-w-xl flex flex-col items-center justify-center">
          <p className="mb-8">{homepageText}</p>

          <div className="flex gap-4">
            <Link href="/sign-up">
              <Button className="md:text-base font-light">New Patient</Button>
            </Link>

            <Link href="/sign-in">
              <Button variant="outline" className="md:text-base underline hover:text-nlue-600">
                Login to account
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <footer className="mt-8">
        <p className="text-center text-sm">
          &copy; 2026 {siteName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
