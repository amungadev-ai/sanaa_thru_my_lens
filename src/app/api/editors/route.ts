import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { generateInviteToken } from "@/lib/editor-auth";
import { sendEmail } from "@/lib/email";
import { editorInviteEmail } from "@/lib/editor-email-templates";
import { bustEditorsCache } from "@/lib/cache-bust";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const INVITE_EXPIRY_DAYS = 7;

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const editors = await db.editor.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      role: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({ editors });
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim() || null;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    // Check if editor already exists
    const existing = await db.editor.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { error: "An editor with this email is already active." },
          { status: 409 }
        );
      }
      // Re-invite a pending/suspended editor
      const token = generateInviteToken();
      const expires = new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400_000);

      await db.editor.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          inviteToken: token,
          inviteExpires: expires,
          status: "PENDING",
        },
      });

      // Send invite email
      const emailContent = editorInviteEmail(email, name, token);
      sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }).catch((e) => console.error("Invite email failed:", e));

      return NextResponse.json({ ok: true, message: "Invite re-sent." });
    }

    // Create new editor
    const token = generateInviteToken();
    const expires = new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400_000);

    const editor = await db.editor.create({
      data: {
        email,
        name,
        inviteToken: token,
        inviteExpires: expires,
        status: "PENDING",
      },
    });

    // Send invite email
    const emailContent = editorInviteEmail(email, name, token);
    sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }).catch((e) => console.error("Invite email failed:", e));

    bustEditorsCache();

    return NextResponse.json({ ok: true, editor }, { status: 201 });
  } catch (e) {
    console.error("POST /api/editors error:", e);
    return NextResponse.json({ error: "Failed to create editor." }, { status: 500 });
  }
}