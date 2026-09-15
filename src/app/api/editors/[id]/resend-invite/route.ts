import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { generateInviteToken } from "@/lib/editor-auth";
import { sendEmail } from "@/lib/email";
import { editorInviteEmail } from "@/lib/editor-email-templates";
import { bustEditorsCache } from "@/lib/cache-bust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/editors/[id]/resend-invite
 * Generates a new token and resends the invite email.
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

  // Generate new token
  const token = generateInviteToken();
  const expires = new Date(Date.now() + 7 * 86400_000);

  await db.editor.update({
    where: { id },
    data: {
      inviteToken: token,
      inviteExpires: expires,
      status: "PENDING",
    },
  });

  // Send invite email
  const emailContent = editorInviteEmail(editor.email, editor.name, token);
  sendEmail({
    to: editor.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  }).catch((e) => console.error("Resend invite email failed:", e));

  bustEditorsCache();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sanaathrumylens.co.ke";
  const inviteUrl = `${baseUrl}/editor/invite/${token}`;

  return NextResponse.json({
    ok: true,
    inviteUrl,
    message: "Invite email resent.",
  });
}
