import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { bustEditorsCache } from "@/lib/cache-bust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/editors/[id]/revoke-invite
 * Clears the invite token, making the old link invalid.
 * The editor record stays (in case admin wants to re-invite later).
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const editor = await db.editor.findUnique({ where: { id } });
  if (!editor) {
    return NextResponse.json({ error: "Editor not found." }, { status: 404 });
  }

  await db.editor.update({
    where: { id },
    data: {
      inviteToken: null,
      inviteExpires: null,
    },
  });

  bustEditorsCache();

  return NextResponse.json({
    ok: true,
    message: "Invite revoked. The old link is no longer valid.",
  });
}
