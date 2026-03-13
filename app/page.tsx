import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { getAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const userId = await getAuthUserId();

  if (userId) {
    const role = await getRole();
    if (role === "master_admin") redirect("/saas");
    redirect(role === "sign-in" ? "/sign-in" : `/${role}`);
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
