import { db } from "@/lib/db";
import { getCachedCalendarPosts, getCachedAllEditorsForAssignment } from "@/lib/data-cache";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarList } from "@/components/calendar/CalendarList";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { Card } from "@/components/ui/card";

export const revalidate = 15;

interface PageProps {
  searchParams: Promise<{ view?: string; month?: string }>;
}

export default async function AdminCalendarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "month";

  // Parse the month from the query string, or default to current month
  const now = new Date();
  const monthParam = sp.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthIdx] = monthParam.split("-").map(Number);
  const monthStart = new Date(year, monthIdx - 1, 1);
  const monthEnd = new Date(year, monthIdx, 0, 23, 59, 59);

  const [posts, editors] = await Promise.all([
    getCachedCalendarPosts(monthStart.toISOString(), monthEnd.toISOString()).catch(() => []),
    getCachedAllEditorsForAssignment().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Content Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan and track your editorial pipeline. Drag posts between statuses, assign editors, and schedule.
        </p>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground">Statuses:</span>
        {[
          { label: "Idea", color: "bg-stone-200 text-stone-700" },
          { label: "Drafting", color: "bg-amber-100 text-amber-700" },
          { label: "In Review", color: "bg-violet-100 text-violet-700" },
          { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
          { label: "Published", color: "bg-emerald-100 text-emerald-700" },
          { label: "Archived", color: "bg-zinc-200 text-zinc-500" },
        ].map((s) => (
          <span key={s.label} className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${s.color}`}>
            {s.label}
          </span>
        ))}
      </div>

      <CalendarHeader view={view} month={monthParam} />

      {view === "list" ? (
        <CalendarList posts={posts} editors={editors} />
      ) : (
        <CalendarGrid posts={posts} editors={editors} year={year} month={monthIdx - 1} />
      )}
    </div>
  );
}
