import { NextResponse } from "next/server";

import { logoutEditor } from "@/lib/editor-auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await logoutEditor();
  return NextResponse.json({ ok: true });
}
