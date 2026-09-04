"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";

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

interface CalendarListProps {
  posts: CalendarPost[];
  editors: EditorOption[];
}

const STATUS_COLORS: Record<string, string> = {
  IDEA: "bg-stone-200 text-stone-700",
  DRAFTING: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-violet-100 text-violet-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-zinc-200 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
  IDEA: "Idea",
  DRAFTING: "Drafting",
  IN_REVIEW: "In Review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function CalendarList({ posts, editors }: CalendarListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="font-serif text-lg font-bold">No posts this month</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch to month view and click a date to start planning.
        </p>
      </div>
    );
  }

  // Sort by date (scheduled first, then created)
  const sorted = [...posts].sort((a, b) => {
    const aDate = a.scheduledAt ?? a.createdAt;
    const bDate = b.scheduledAt ?? b.createdAt;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  const editorMap = new Map(editors.map((e) => [e.id, e.name ?? e.email] as const));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Editor</th>
            <th className="px-4 py-3 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => {
            const date = post.scheduledAt ?? post.createdAt;
            const editorName = post.authorId ? editorMap.get(post.authorId) ?? post.author : post.author;

            return (
              <tr key={post.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                <td className="px-4 py-3">
                  {post.status === "PUBLISHED" ? (
                    <Link
                      href={`/post/${post.slug}`}
                      target="_blank"
                      className="line-clamp-1 font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="line-clamp-1 font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  )}
                  {post.category && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{post.category}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[post.status] ?? "bg-stone-100 text-stone-700")}>
                    {STATUS_LABELS[post.status] ?? post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {post.scheduledAt ? formatDateSafe(post.scheduledAt) : formatDateSafe(post.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{editorName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {post.calendarNote ? <span className="line-clamp-1 text-xs">{post.calendarNote}</span> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
