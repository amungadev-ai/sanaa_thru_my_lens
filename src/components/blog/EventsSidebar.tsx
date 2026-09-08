import Link from "next/link";
import { getCachedUpcomingEvents } from "@/lib/data-cache";
import { EventCard } from "@/components/blog/EventCard";
import { CalendarDays } from "lucide-react";
import type { PublicEvent } from "@/lib/events";

export async function EventsSidebar() {
  const events = await getCachedUpcomingEvents(3).catch(() => []);

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">Upcoming Events</h3>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={{
              id: event.id,
              title: event.title,
              slug: event.slug,
              description: event.description,
              coverImage: event.coverImage,
              category: event.category,
              venue: event.venue,
              city: event.city,
              address: event.address,
              startDate: event.startDate,
              endDate: event.endDate,
              ticketPrice: event.ticketPrice,
              ticketUrl: event.ticketUrl,
              eventUrl: event.eventUrl,
            } as PublicEvent}
            variant="compact"
          />
        ))}
      </div>
      <Link
        href="/events"
        className="mt-3 block text-center text-xs font-semibold text-primary hover:underline"
      >
        See more events →
      </Link>
    </div>
  );
}
