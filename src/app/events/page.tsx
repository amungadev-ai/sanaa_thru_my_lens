import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { EventCard } from "@/components/blog/EventCard";
import { getCachedAllEvents, getCachedEventCities } from "@/lib/data-cache";
import { getEventStatus } from "@/lib/events";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description: "What's on in Kenya's creative scene — concerts, exhibitions, festivals, and more.",
};

interface PageProps {
  searchParams: Promise<{ filter?: string; city?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter = (sp.filter === "past" || sp.filter === "all" ? sp.filter : "upcoming") as "upcoming" | "past" | "all";
  const city = sp.city ?? "all";

  const [events, cities] = await Promise.all([
    getCachedAllEvents(filter, city).catch(() => []),
    getCachedEventCities().catch(() => []),
  ]);

  // Group events by month
  const eventsByMonth = new Map<string, typeof events>();
  for (const event of events) {
    const date = new Date(event.startDate);
    const monthKey = date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
    if (!eventsByMonth.has(monthKey)) eventsByMonth.set(monthKey, []);
    eventsByMonth.get(monthKey)!.push(event);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">What&apos;s On</p>
            <h1 className="display-serif mt-2 text-4xl text-foreground md:text-5xl">Events</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Concerts, exhibitions, festivals, and literary gatherings across Kenya&apos;s creative scene.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-md border border-border p-1">
                {(["upcoming", "past", "all"] as const).map((f) => (
                  <a
                    key={f}
                    href={`/events?filter=${f}${city !== "all" ? `&city=${city}` : ""}`}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "upcoming" ? "Upcoming" : f === "past" ? "Past" : "All"}
                  </a>
                ))}
              </div>

              {/* City filter */}
              {cities.length > 1 && (
                <select
                  defaultValue={city}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    if (e.target.value === "all") url.searchParams.delete("city");
                    else url.searchParams.set("city", e.target.value);
                    window.location.href = url.toString();
                  }}
                >
                  <option value="all">All cities</option>
                  {cities.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              )}

              <span className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            </div>
          </div>
        </section>

        {/* Events */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-serif text-xl font-bold">
                {filter === "upcoming" ? "No upcoming events" : "No events found"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "upcoming"
                  ? "Check back soon — we're always adding new events."
                  : "Try a different filter or city."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Array.from(eventsByMonth.entries()).map(([month, monthEvents]) => (
                <div key={month}>
                  <h2 className="mb-4 font-serif text-xl font-bold text-muted-foreground">{month}</h2>
                  <div className="space-y-4">
                    {monthEvents.map((event) => (
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
                        }}
                        variant="list"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
