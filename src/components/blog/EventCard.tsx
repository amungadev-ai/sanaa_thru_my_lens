import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEventDateShort,
  formatEventTime,
  getEventStatus,
} from "@/lib/events";
import type { PublicEvent } from "@/lib/events";

interface EventCardProps {
  event: PublicEvent;
  variant?: "default" | "compact" | "list";
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  live: "bg-emerald-100 text-emerald-700 animate-pulse",
  past: "bg-stone-200 text-stone-500",
};

export function EventCard({ event, variant = "default", className }: EventCardProps) {
  const status = getEventStatus(event.startDate, event.endDate);
  const date = new Date(event.startDate);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-KE", { month: "short" });

  if (variant === "compact") {
    return (
      <Link
        href={`/events/${event.slug}`}
        className={cn("group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-secondary/50", className)}
      >
        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-xs uppercase">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium group-hover:text-primary">{event.title}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {event.venue ?? event.city}
          </p>
        </div>
        {status === "live" && (
          <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
            Live
          </span>
        )}
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link
        href={`/events/${event.slug}`}
        className={cn("group grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm sm:grid-cols-[100px_1fr]", className)}
      >
        {/* Date block */}
        <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 p-3 text-center">
          <span className="text-2xl font-bold text-primary">{day}</span>
          <span className="text-sm uppercase tracking-wider text-muted-foreground">{month}</span>
          <span className="mt-1 text-xs text-muted-foreground">{date.getFullYear()}</span>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[status])}>
              {status}
            </span>
            {event.category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {event.category}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-serif text-lg font-bold leading-tight group-hover:text-primary">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatEventTime(event.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.venue ? `${event.venue}, ${event.city}` : event.city}
            </span>
            {event.ticketPrice && (
              <span className="font-medium text-primary">{event.ticketPrice}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default card (grid)
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      {event.coverImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-md bg-card/95 backdrop-blur">
            <span className="text-xl font-bold text-primary leading-none">{day}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{month}</span>
          </div>
          {status === "live" && (
            <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white animate-pulse">
              ● Live now
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs">
          {event.category && (
            <span className="font-semibold uppercase tracking-wider text-primary">
              {event.category}
            </span>
          )}
          <span className={cn("rounded-full px-2 py-0.5 font-bold uppercase", STATUS_STYLES[status])}>
            {status}
          </span>
        </div>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug group-hover:text-primary">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatEventTime(event.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.venue ? `${event.venue}, ${event.city}` : event.city}
          </span>
          {event.ticketPrice && (
            <span className="font-medium text-primary">{event.ticketPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
