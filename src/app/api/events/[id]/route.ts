import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { bustEventsCache } from "@/lib/cache-bust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = String(body.title);
    if (body.slug !== undefined) {
      const newSlug = slugify(String(body.slug));
      if (newSlug !== existing.slug) {
        const conflict = await db.event.findUnique({ where: { slug: newSlug } });
        if (conflict && conflict.id !== id) {
          return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
        }
      }
      data.slug = newSlug;
    }
    if (body.description !== undefined) data.description = body.description || null;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.category !== undefined) data.category = body.category || null;
    if (body.venue !== undefined) data.venue = body.venue || null;
    if (body.city !== undefined) data.city = body.city || "Nairobi";
    if (body.address !== undefined) data.address = body.address || null;
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.ticketPrice !== undefined) data.ticketPrice = body.ticketPrice || null;
    if (body.ticketUrl !== undefined) data.ticketUrl = body.ticketUrl || null;
    if (body.eventUrl !== undefined) data.eventUrl = body.eventUrl || null;
    if (body.status !== undefined) {
      data.status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    }

    const updated = await db.event.update({ where: { id }, data });
    bustEventsCache();
    return NextResponse.json({ ok: true, event: updated });
  } catch (e) {
    console.error("PUT /api/events/[id] error:", e);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.event.delete({ where: { id } });
    bustEventsCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }
}
