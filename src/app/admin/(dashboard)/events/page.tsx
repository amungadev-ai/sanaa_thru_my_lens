import Link from "next/link";
import { getCachedAllEventsAdmin, getCachedEventStats } from "@/lib/data-cache";
import { getEventStatus, formatEventDateShort } from "@/lib/events";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin } from "lucide-react";
import { AdminEventsTable } from "./AdminEventsTable";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function AdminEventsPage() {
  const [events, stats] = await Promise.all([
    getCachedAllEventsAdmin().catch(() => []),
    getCachedEventStats().catch(() => ({ total: 0, upcoming: 0, past: 0 })),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"} total.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-2 font-serif text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</p>
          <p className="mt-2 font-serif text-2xl font-bold text-blue-600">{stats.upcoming}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</p>
          <p className="mt-2 font-serif text-2xl font-bold text-muted-foreground">{stats.past}</p>
        </Card>
      </div>

      {/* Events table */}
      <Card className="p-0">
        <AdminEventsTable events={events.map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          status: e.status,
          category: e.category,
          city: e.city,
          venue: e.venue,
          startDate: e.startDate.toISOString(),
        }))} />
      </Card>
    </div>
  );
}
