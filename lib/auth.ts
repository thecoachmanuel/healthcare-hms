import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getAuthUserId() {
  const user = await getAuthUser();
  return user?.id ?? null;
}

export async function requireAuthUserId() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}
