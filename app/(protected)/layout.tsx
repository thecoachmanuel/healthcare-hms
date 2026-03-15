import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import React from "react";

export const dynamic = "force-dynamic";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full min-h-screen flex bg-gray-200 print:block">
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] print:hidden">
        <Sidebar />
      </div>

      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] flex flex-col print:w-full">
        <div className="print:hidden">
          <Navbar />
        </div>

        <div className="w-full p-2 print:overflow-visible print:p-0">{children}</div>
      </div>
    </div>
  );
};

export default ProtectedLayout;
