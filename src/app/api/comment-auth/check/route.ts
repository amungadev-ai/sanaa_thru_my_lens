import { NextResponse } from "next/server";
import { getCurrentCommenter } from "@/lib/commenter-auth";

/** GET — returns whether the current visitor is logged in to comment */
export async function GET() {
  const commenter = await getCurrentCommenter();
  if (!commenter) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({
    ok: true,
    name: commenter.name,
    type: commenter.type,
    email: commenter.email,
  });
}
