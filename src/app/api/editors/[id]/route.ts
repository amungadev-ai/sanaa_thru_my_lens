import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Don't delete — just suspend so their posts remain intact
    await db.editor.update({
      where: { id },
      data: { status: "SUSPENDED", inviteToken: null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Editor not found." }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const status = body.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED";

    const editor = await db.editor.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ ok: true, editor });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 404 });
  }
}
