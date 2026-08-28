import { NextResponse } from "next/server";
import { logoutEditor } from "@/lib/editor-auth";

export async function POST() {
  await logoutEditor();
  return NextResponse.json({ ok: true });
}
