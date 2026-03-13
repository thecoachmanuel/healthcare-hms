import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { getAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import Image from "next/image";

const getSiteSettings = unstable_cache(
  async () => {
    try {
      return await db.siteSettings.findFirst({ orderBy: { id: "asc" } });
    } catch {
      return null;
    }
  },
  ["site-settings:primary"],
  { tags: ["site-settings"], revalidate: 60 * 60 }
);

export default async function Home() {
  const userId = await getAuthUserId();

  if (userId) {
    const role = await getRole();
    redirect(role === "sign-in" ? "/sign-in" : `/${role}`);
  }

  const settings = await getSiteSettings();
  const homepageTitle = settings?.homepage_title?.trim() || "Welcome to Healthcare HMS";
  const homepageSubtitle = settings?.homepage_subtitle?.trim() || "";
  const homepageText =
    settings?.homepage_text?.trim() ||
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse maxime quae numquam possimus dolor. Illum, ipsam laudantium. Reprehenderit";
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
