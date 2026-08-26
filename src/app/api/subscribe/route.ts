import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim() || null;
    const source = String(body.source ?? "WEBSITE").trim();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (email.length > 191) {
      return NextResponse.json(
        { ok: false, error: "Email address is too long." },
        { status: 400 }
      );
    }

    // Check for existing subscriber
    const existing = await db.subscriber.findUnique({ where: { email } });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({
          ok: true,
          message: "You're already subscribed! Thanks for being part of the community.",
          duplicate: true,
        });
      }
      // Re-subscribe previously unsubscribed user
      await db.subscriber.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", name: name ?? existing.name },
      });
      return NextResponse.json({
        ok: true,
        message: "Welcome back! You've been re-subscribed to The Weekly Dispatch.",
      });
    }

    // Create new subscriber
    await db.subscriber.create({
      data: {
        email,
        name,
        status: "ACTIVE",
        source: source || "WEBSITE",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "You're in! Check your inbox for a welcome note from Sanaa Thrumylens.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/subscribe error:", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET — public endpoint returning the total subscriber count.
 * Used by the CMS dashboard and optionally on the public site.
 */
export async function GET() {
  const count = await db.subscriber.count({ where: { status: "ACTIVE" } });
  return NextResponse.json({ ok: true, count });
}
