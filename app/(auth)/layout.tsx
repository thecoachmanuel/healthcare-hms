import Image from "next/image";
import React from "react";
import db from "@/lib/db";
import { unstable_cache } from "next/cache";

const getSiteSettings = unstable_cache(
  async () =>
    db.siteSettings.findFirst({
      orderBy: { id: "asc" },
      select: { site_name: true, logo_url: true },
    }),
  ["site-settings"],
  { tags: ["site-settings"] }
);

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const settings = await getSiteSettings();
  const siteName = (settings?.site_name ?? "").trim();
  const displaySiteName = siteName.length > 0 ? siteName : "Healthcare HMS";

  return (
    <div className="w-full min-h-screen md:h-screen flex overflow-hidden">
      <div className="w-full md:w-1/2 min-h-screen md:h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10 md:py-0 overflow-y-auto">
        {children}
      </div>
      <div className="hidden md:flex w-1/2 h-screen relative overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/6129437/pexels-photo-6129437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          width={1000}
          height={1000}
          alt="Doctors"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 w-full h-full bg-black bg-opacity-40 z-10 flex flex-col items-center justify-center">
          <h1 className="text-3xl 2xl:text-5xl font-bold text-white">
            {displaySiteName}
          </h1>
          <p className="text-blue-500 text-base">You're welcome</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
