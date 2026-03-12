import { requireAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

const PatientSelfPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const userId = await requireAuthUserId();
  const sp = await searchParams;
  const query = sp ? new URLSearchParams(sp as any).toString() : "";
  redirect(query ? `/patient/${userId}?${query}` : `/patient/${userId}`);
};

export default PatientSelfPage;
