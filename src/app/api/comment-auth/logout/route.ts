import { NextResponse } from "next/server";
import { logoutCommenter } from "@/lib/commenter-auth";

export async function POST() {
  await logoutCommenter();
  return NextResponse.json({ ok: true });
}
