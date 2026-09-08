import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateICS } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const ics = generateICS({
    title: event.title,
    description: event.description,
    venue: event.venue,
    city: event.city,
    address: event.address,
    startDate: event.startDate,
    endDate: event.endDate,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
