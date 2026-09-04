import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/commenter-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const reader = await verifyMagicLink(token);
    if (!reader) {
      return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, name: reader.name });
  } catch {
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
