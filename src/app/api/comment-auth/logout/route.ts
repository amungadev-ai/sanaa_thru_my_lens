import { NextResponse } from "next/server";

import { logoutCommenter } from "@/lib/commenter-auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await logoutCommenter();
  return NextResponse.json({ ok: true });
}
