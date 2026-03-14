import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import ProvidersClient from "./providers-client";

const HmoProvidersPage = async () => {
  await requireAuthUserId();
  const isAdmin = await checkRole("ADMIN" as any);
  if (!isAdmin) return null;

  const providers = await db.hmoProvider.findMany({ orderBy: { name: "asc" } });

  return <ProvidersClient providers={providers} />;
};

export default HmoProvidersPage;

