/**
 * Event helper functions — formatting, status detection.
 */

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  category: string | null;
  venue: string | null;
  city: string;
  address: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  ticketPrice: string | null;
  ticketUrl: string | null;
  eventUrl: string | null;
}

export function getEventStatus(startDate: Date | string, endDate?: Date | string | null): "upcoming" | "live" | "past" {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3 * 3600_000); // default 3h event

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "past";
}

export function formatEventDate(startDate: Date | string, endDate?: Date | string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const startStr = start.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!end || start.toDateString() === end.toDateString()) {
    // Same day — show time
    const timeStr = start.toLocaleTimeString("en-KE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${startStr} · ${timeStr}`;
  }

  // Multi-day
  const endStr = end.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startStr} — ${endStr}`;
}

export function formatEventDateShort(startDate: Date | string): string {
  const date = new Date(startDate);
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

export function formatEventTime(startDate: Date | string): string {
  return new Date(startDate).toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Generate a Google Calendar "add event" URL.
 */
export function googleCalendarUrl(event: {
  title: string;
  description?: string | null;
  venue?: string | null;
  city?: string;
  startDate: Date | string;
  endDate?: Date | string | null;
}): string {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 3 * 3600_000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ctz: "Africa/Nairobi",
  });

  if (event.description) params.set("details", event.description);
  const location = [event.venue, event.city].filter(Boolean).join(", ");
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an .ics file content for Apple Calendar / Outlook.
 */
export function generateICS(event: {
  title: string;
  description?: string | null;
  venue?: string | null;
  city?: string;
  address?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
}): string {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 3 * 3600_000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const location = [event.venue, event.address, event.city].filter(Boolean).join(", ");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanaa Thrumylens//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.title}@sanaathrumylens.co.ke`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function slugifyEvent(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
