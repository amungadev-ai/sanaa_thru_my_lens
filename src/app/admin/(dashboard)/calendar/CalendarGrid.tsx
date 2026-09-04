"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";
import { CalendarPostDialog } from "@/app/admin/(dashboard)/calendar/CalendarPostDialog";

interface CalendarPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  authorId: string | null;
  author: string;
  scheduledAt: string | null;
  calendarNote: string | null;
  createdAt: string;
}

interface EditorOption {
  id: string;
  name: string | null;
  email: string;
}

interface CalendarGridProps {
  posts: CalendarPost[];
  editors: EditorOption[];
  year: number;
  month: number; // 0-indexed (0 = January)
}

const STATUS_COLORS: Record<string, string> = {
  IDEA: "bg-stone-200 text-stone-700 border-stone-300",
  DRAFTING: "bg-amber-100 text-amber-700 border-amber-200",
  IN_REVIEW: "bg-violet-100 text-violet-700 border-violet-200",
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-zinc-200 text-zinc-500 border-zinc-300",
};

function getPostDate(post: CalendarPost): Date {
  if (post.scheduledAt) return new Date(post.scheduledAt);
  if (post.status === "PUBLISHED") return new Date(post.createdAt);
  return new Date(post.createdAt);
}

export function CalendarGrid({ posts, editors, year, month }: CalendarGridProps) {
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  // Group posts by day
  const postsByDay = useMemo(() => {
    const map = new Map<number, CalendarPost[]>();
    for (const post of posts) {
      const date = getPostDate(post);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(post);
      }
    }
    return map;
  }, [posts, year, month]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
          {weekdays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="min-h-[100px] border-b border-r border-border bg-secondary/10" />;
            }
            const dayPosts = postsByDay.get(day) ?? [];
            const isToday = isCurrentMonth && today.getDate() === day;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            return (
              <div
                key={i}
                className={cn(
                  "group relative min-h-[100px] border-b border-r border-border p-1.5 last:border-r-0",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Day number + quick-add */}
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </span>
                  <button
                    onClick={() => setDialogDate(dateStr)}
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                    title="Quick add"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Posts */}
                <div className="space-y-1">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={cn(
                        "block w-full truncate rounded border px-1.5 py-1 text-left text-xs font-medium transition-colors hover:opacity-80",
                        STATUS_COLORS[post.status] ?? "bg-stone-100 text-stone-700 border-stone-200"
                      )}
                      title={post.title}
                    >
                      <span className="truncate">{post.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post detail/edit dialog */}
      {selectedPost && (
        <CalendarPostDialog
          post={selectedPost}
          editors={editors}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Quick-add dialog */}
      {dialogDate && (
        <CalendarPostDialog
          date={dialogDate}
          editors={editors}
          onClose={() => setDialogDate(null)}
        />
      )}
    </>
  );
}
