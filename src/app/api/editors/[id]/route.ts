import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { bustEditorsCache } from "@/lib/cache-bust";
import { sendEmail } from "@/lib/email";
import { editorSuspendedEmail, editorReactivatedEmail } from "@/lib/editor-email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const editor = await db.editor.update({
      where: { id },
      data: { status: "SUSPENDED", inviteToken: null, inviteExpires: null },
    });

    // Send suspension email
    const emailContent = editorSuspendedEmail(editor.email, editor.name);
    sendEmail({
      to: editor.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }).catch((e) => console.error("Suspension email failed:", e));

    bustEditorsCache();
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
    const newStatus = body.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED";

    const editor = await db.editor.update({
      where: { id },
      data: { status: newStatus },
    });

    // Send notification email
    if (newStatus === "SUSPENDED") {
      const emailContent = editorSuspendedEmail(editor.email, editor.name);
      sendEmail({
        to: editor.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }).catch((e) => console.error("Suspension email failed:", e));
    } else if (newStatus === "ACTIVE" && editor.passwordHash) {
      // Only send reactivation email if they have a password set
      const emailContent = editorReactivatedEmail(editor.email, editor.name);
      sendEmail({
        to: editor.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }).catch((e) => console.error("Reactivation email failed:", e));
    }

    bustEditorsCache();
    return NextResponse.json({ ok: true, editor });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 404 });
  }
}
