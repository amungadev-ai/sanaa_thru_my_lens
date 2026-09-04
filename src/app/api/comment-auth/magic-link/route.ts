import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, findCommenterByEmail } from "@/lib/commenter-auth";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const { token, isExisting } = await createMagicLink(email);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saaathrumylens.co.ke";
    const link = `${baseUrl}/comment-login/verify?token=${token}`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #A0421C;">Comment on Sanaa Thrumylens</h2>
        <p>Click the button below to log in and join the conversation:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #A0421C; color: #FFF8EE; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log in to comment</a>
        </p>
        <p style="color: #6B5642; font-size: 14px;">This link expires in 1 hour and can only be used once.</p>
        <hr style="border: none; border-top: 1px solid #DCCBB1; margin: 24px 0;">
        <p style="color: #8B7355; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    sendEmail({
      to: email,
      subject: "Your Sanaa Thrumylens comment login link",
      html,
      text: `Log in to comment on Sanaa Thrumylens: ${link}`,
    }).catch((e) => console.error("Magic link email failed:", e));

    return NextResponse.json({ ok: true, isExisting });
  } catch (e) {
    console.error("Magic link error:", e);
    return NextResponse.json({ error: "Failed to send magic link." }, { status: 500 });
  }
}
