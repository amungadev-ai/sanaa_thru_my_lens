import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { isAuthenticated } from "@/lib/auth";

import { bustCategoriesCache } from "@/lib/cache-bust";


interface RouteContext {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.category.delete({ where: { id } });
    // Bust the cache so the category disappears immediately
    bustCategoriesCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
}
