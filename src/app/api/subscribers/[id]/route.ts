import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE — remove a subscriber entirely.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.subscriber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Subscriber not found." },
      { status: 404 }
    );
  }
}

/**
 * PUT — update subscriber status (e.g., mark as unsubscribed).
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const status = body.status === "ACTIVE" ? "ACTIVE" : "UNSUBSCRIBED";

    const updated = await db.subscriber.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ ok: true, subscriber: updated });
  } catch {
    return NextResponse.json(
      { error: "Subscriber not found or update failed." },
      { status: 404 }
    );
  }
}
