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

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await db.event.findMany({
    orderBy: { startDate: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      city: true,
      startDate: true,
      venue: true,
    },
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    let slug = String(body.slug ?? "").trim() || slugify(title);
    // Check slug uniqueness
    const existing = await db.event.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await db.event.create({
      data: {
        title,
        slug,
        description: body.description || null,
        coverImage: body.coverImage || null,
        category: body.category || null,
        venue: body.venue || null,
        city: body.city || "Nairobi",
        address: body.address || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        ticketPrice: body.ticketPrice || null,
        ticketUrl: body.ticketUrl || null,
        eventUrl: body.eventUrl || null,
        status: body.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      },
    });

    bustEventsCache();
    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (e) {
    console.error("POST /api/events error:", e);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
