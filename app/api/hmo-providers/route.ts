import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthUserId } from "@/lib/auth";
import { checkRole } from "@/utils/roles";

export async function GET() {
  try {
    const providers = await db.hmoProvider.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, active: true },
    });
    return NextResponse.json({ success: true, data: providers });
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to load providers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    if (!isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const code = body?.code ? String(body.code).trim() : undefined;
    if (!name) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    const created = await db.hmoProvider.create({ data: { name, code: code || undefined, active: true } });
    return NextResponse.json({ success: true, data: created });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ success: false, message: "Provider with same name/code exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Failed to create provider" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    if (!isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    const data: any = {};
    if (typeof body?.active === "boolean") data.active = body.active;
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.code === "string") data.code = body.code.trim() || null;
    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, message: "No changes" }, { status: 400 });

    const updated = await db.hmoProvider.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ success: false, message: "Name or code already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Failed to update provider" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAuthUserId();
    const isAdmin = await checkRole("ADMIN" as any);
    if (!isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    await db.hmoProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: "Failed to delete provider" }, { status: 500 });
  }
}
