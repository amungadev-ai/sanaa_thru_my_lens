import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMagicLinkToken, hashPassword } from "@/lib/commenter-auth";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    // Check if reader already exists
    const existing = await db.reader.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });
    }

    // Create reader with optional password
    const passwordHash = password.length >= MIN_PASSWORD_LENGTH ? await hashPassword(password) : null;
    const token = generateMagicLinkToken();
    const expiry = new Date(Date.now() + 3600_000);

    await db.reader.create({
      data: {
        email,
        name,
        passwordHash,
        magicLinkToken: token,
        magicLinkExpiry: expiry,
      },
    });

    // Send verification magic link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saaathrumylens.co.ke";
    const link = `${baseUrl}/comment-login/verify?token=${token}`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #A0421C;">Welcome to Sanaa Thrumylens, ${name}!</h2>
        <p>Click the button below to verify your email and start commenting:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #A0421C; color: #FFF8EE; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Verify & start commenting</a>
        </p>
        <p style="color: #6B5642; font-size: 14px;">This link expires in 1 hour.</p>
      </div>
    `;

    sendEmail({
      to: email,
      subject: "Verify your Sanaa Thrumylens account",
      html,
      text: `Verify your account: ${link}`,
    }).catch((e) => console.error("Registration email failed:", e));

    return NextResponse.json({ ok: true, message: "Check your email for a verification link." });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
