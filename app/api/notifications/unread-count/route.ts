import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import db from "@/lib/db";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return NextResponse.json({ count: 0 }, { status: 200 });

  const count = await (db as any).notification.count({
    where: { user_id: userId, read: false },
  });

  return NextResponse.json({ count }, { status: 200 });
}
