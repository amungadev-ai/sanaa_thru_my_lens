import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
  ArrowLeft,
  Share2,
  CalendarPlus,
} from "lucide-react";
import { getCachedEventBySlug } from "@/lib/data-cache";
import {
  formatEventDate,
  getEventStatus,
  googleCalendarUrl,
  generateICS,
} from "@/lib/events";
import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ShareButtons } from "@/components/blog/ShareButtons";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getCachedEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description ?? `Event on ${formatEventDate(event.startDate, event.endDate)}`,
    openGraph: {
      title: event.title,
      description: event.description ?? "",
      type: "article",
      images: event.coverImage ? [{ url: event.coverImage }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getCachedEventBySlug(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const status = getEventStatus(event.startDate, event.endDate);
  const dateStr = formatEventDate(event.startDate, event.endDate);
  const gcalUrl = googleCalendarUrl(event);
  const icsContent = generateICS(event);

  const mapsUrl = event.address
    ? `https://www.google.com/maps/search/${encodeURIComponent(event.address)}`
    : event.venue
      ? `https://www.google.com/maps/search/${encodeURIComponent(`${event.venue}, ${event.city}`)}`
      : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <article className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-4xl px-4 py-3 md:px-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All events
            </Link>
          </div>
        </div>

        {/* Cover image */}
        {event.coverImage && (
          <div className="relative aspect-[21/9] w-full overflow-hidden">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-center gap-2">
                  {event.category && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                      {event.category}
                    </span>
                  )}
                  <span
                    className={
                      status === "upcoming"
                        ? "inline-flex items-center rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold uppercase text-white"
                        : status === "live"
                          ? "inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase text-white animate-pulse"
                          : "inline-flex items-center rounded-full bg-stone-500 px-2.5 py-1 text-xs font-bold uppercase text-white"
                    }
                  >
                    {status === "upcoming" ? "Upcoming" : status === "live" ? "● Live now" : "Past event"}
                  </span>
                </div>
                <h1 className="display-serif mt-3 text-3xl text-white md:text-5xl">
                  {event.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
          {!event.coverImage && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                {event.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {event.category}
                  </span>
                )}
                <span
                  className={
                    status === "upcoming"
                      ? "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase text-blue-700"
                      : status === "live"
                        ? "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase text-emerald-700 animate-pulse"
                        : "inline-flex items-center rounded-full bg-stone-200 px-2.5 py-1 text-xs font-bold uppercase text-stone-600"
                  }
                >
                  {status === "upcoming" ? "Upcoming" : status === "live" ? "● Live now" : "Past event"}
                </span>
              </div>
              <h1 className="display-serif mt-3 text-3xl text-foreground md:text-5xl">{event.title}</h1>
            </div>
          )}

          {/* Event details card */}
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</p>
                <p className="mt-1 text-sm font-medium">{dateStr}</p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venue</p>
                <p className="mt-1 text-sm font-medium">
                  {event.venue ?? event.city}
                  {event.venue && <span className="text-muted-foreground">, {event.city}</span>}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View on map <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Ticket info */}
            {event.ticketPrice && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tickets</p>
                  <p className="mt-1 text-sm font-medium">{event.ticketPrice}</p>
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Buy tickets <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Event website */}
            {event.eventUrl && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <ExternalLink className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</p>
                  <a
                    href={event.eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Official event page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-8">
              <h2 className="font-serif text-xl font-bold">About this event</h2>
              <p className="article-prose mt-4 text-foreground/90">{event.description}</p>
            </div>
          )}

          {/* Add to calendar + Share */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap gap-2">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Google Calendar
              </a>
              <a
                href={`/api/events/${event.id}/ics`}
                download={`${event.slug}.ics`}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                <CalendarPlus className="h-4 w-4" />
                Apple/Outlook (.ics)
              </a>
            </div>
            <ShareButtons title={event.title} slug={`events/${event.slug}`} />
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
