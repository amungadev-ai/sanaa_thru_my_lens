import { getCurrentEditor } from "@/lib/editor-auth";
import { getCachedEditorCalendarPosts } from "@/lib/data-cache";
import { EditorCalendarGrid } from "./EditorCalendarGrid";
import { CalendarList } from "@/components/calendar/CalendarList";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";

export const revalidate = 15;

interface PageProps {
  searchParams: Promise<{ view?: string; month?: string }>;
}

export default async function EditorCalendarPage({ searchParams }: PageProps) {
  const editor = await getCurrentEditor();
  if (!editor) return null;

  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "month";

  const now = new Date();
  const monthParam = sp.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthIdx] = monthParam.split("-").map(Number);
  const monthStart = new Date(year, monthIdx - 1, 1);
  const monthEnd = new Date(year, monthIdx, 0, 23, 59, 59);

  const posts = await getCachedEditorCalendarPosts(editor.id, monthStart.toISOString(), monthEnd.toISOString()).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">My Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your assigned stories and scheduled posts. Plan your writing pipeline.
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
        ].map((s) => (
          <span key={s.label} className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${s.color}`}>
            {s.label}
          </span>
        ))}
      </div>

      <CalendarHeader view={view} month={monthParam} />

      {view === "list" ? (
        <CalendarList posts={posts} editors={[]} />
      ) : (
        <EditorCalendarGrid posts={posts} year={year} month={monthIdx - 1} />
      )}
    </div>
  );
}
