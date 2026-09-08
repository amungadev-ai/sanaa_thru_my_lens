"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, ExternalLink, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getEventStatus, formatEventDateShort } from "@/lib/events";

interface EventRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  city: string;
  venue: string | null;
  startDate: string;
}

export function AdminEventsTable({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Event deleted");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="p-12 text-center">
        <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-serif text-lg font-bold">No events yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first event using the &ldquo;New Event&rdquo; button.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Venue</th>
            <th className="px-4 py-3 font-medium">City</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const eventStatus = getEventStatus(e.startDate);
            return (
              <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${e.id}/edit`} className="line-clamp-1 font-medium hover:text-primary">
                    {e.title}
                  </Link>
                  {e.category && <span className="mt-0.5 block text-xs text-muted-foreground">{e.category}</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatEventDateShort(e.startDate)}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.venue ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.city}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      e.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                      eventStatus === "live" && "animate-pulse",
                      eventStatus === "past" && "bg-stone-200 text-stone-500"
                    )}
                  >
                    {eventStatus === "upcoming" ? e.status : eventStatus === "live" ? "● Live" : "Past"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {e.status === "PUBLISHED" && (
                      <Link
                        href={`/events/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on site"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/events/${e.id}/edit`}
                      title="Edit"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(e.id, e.title)}
                      disabled={deletingId === e.id}
                      title="Delete"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
