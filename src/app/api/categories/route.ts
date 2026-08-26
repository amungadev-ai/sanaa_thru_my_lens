import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const slug = String(body.slug ?? "").trim() || slugify(name);
    const description = String(body.description ?? "").trim() || null;

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Category with this slug already exists." }, { status: 409 });
    }

    const category = await db.category.create({
      data: { name, slug, description },
    });
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e) {
    console.error("POST /api/categories error:", e);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
