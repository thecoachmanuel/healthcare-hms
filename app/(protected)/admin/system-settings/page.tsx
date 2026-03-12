import { SettingsQuickLinks } from "@/components/settings/quick-link-settings";
import { SiteSettingsSection } from "@/components/settings/site-settings";
import { ServiceCatalogSettings } from "@/components/settings/service-catalog-settings";
import { LabUnitsSettings } from "@/components/settings/lab-units-settings";
import { SpecializationsSettings } from "@/components/settings/specializations-settings";
import { DepartmentsSettings } from "@/components/settings/departments-settings";
import { Card } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { redirect } from "next/navigation";

const SystemSettingPage = async (props: SearchParamsProps) => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN");
  if (!isAdmin) redirect("/");

  const searchParams = await props.searchParams;
  const cat = (searchParams?.cat || "services") as string;
  const q = (searchParams?.q || "") as string;
  const unit = (searchParams?.unit || "") as string;

  return (
    <div className="p-6 flex flex-col lg:flex-row w-full min-h-screen gap-10">
      <div className="w-full lg:w-[70%] flex flex-col gap-4">
        <Card className="shadow-none rounded-xl">
          {cat === "services" && (
            <ServiceCatalogSettings category="GENERAL" q={q} />
          )}
          {cat === "medications" && (
            <ServiceCatalogSettings category="MEDICATION" q={q} />
          )}
          {cat === "lab-tests" && (
            <ServiceCatalogSettings category="LAB_TEST" q={q} unitId={unit} />
          )}
          {cat === "lab-units" && <LabUnitsSettings q={q} />}
          {cat === "specializations" && <SpecializationsSettings q={q} />}
          {cat === "departments" && <DepartmentsSettings q={q} />}
          {cat === "site" && <SiteSettingsSection />}
        </Card>
      </div>
      <div className="w-full space-y-6">
        <SettingsQuickLinks />
      </div>
    </div>
  );
};

export default SystemSettingPage;
