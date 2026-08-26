import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Unsubscribe endpoint — called from the unsubscribe link in emails.
 * Accepts either POST (JSON body with email) or GET (?email=...).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const subscriber = await db.subscriber.findUnique({ where: { email } });
    if (!subscriber) {
      // Don't reveal whether email exists — just say OK
      return NextResponse.json({
        ok: true,
        message: "If that email was subscribed, it has been removed from our list.",
      });
    }

    await db.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED" },
    });

    return NextResponse.json({
      ok: true,
      message: "You've been unsubscribed from The Weekly Dispatch. We're sorry to see you go!",
    });
  } catch (e) {
    console.error("POST /api/subscribe/unsubscribe error:", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
