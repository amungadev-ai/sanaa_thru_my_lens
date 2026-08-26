import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Increment a post's view count. Public endpoint — called once per session
 * per post from the article page's ViewTracker component.
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    await db.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Silent failure — view tracking is best-effort
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
