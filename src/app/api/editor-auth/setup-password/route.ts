import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateInviteToken, hashPassword } from "@/lib/editor-auth";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const editor = await validateInviteToken(token);
    if (!editor) {
      return NextResponse.json(
        { error: "This invite link is invalid or has expired." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db.editor.update({
      where: { id: editor.id },
      data: {
        passwordHash,
        name: name ?? editor.name,
        status: "ACTIVE",
        inviteToken: null,
        inviteExpires: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Password set. You can now log in." });
  } catch (e) {
    console.error("Setup password error:", e);
    return NextResponse.json({ error: "Failed to set password." }, { status: 500 });
  }
}
