import { NextRequest, NextResponse } from "next/server";
import { loginReaderWithPassword } from "@/lib/commenter-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await loginReaderWithPassword(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ ok: true, name: result.reader.name });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
