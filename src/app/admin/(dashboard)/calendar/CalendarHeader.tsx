"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  view: "month" | "list";
  month: string; // "2026-09"
}

export function CalendarHeader({ view, month }: CalendarHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [year, monthIdx] = month.split("-").map(Number);
  const monthDate = new Date(year, monthIdx - 1, 1);
  const monthName = monthDate.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  const prevMonth = new Date(year, monthIdx - 2, 1);
  const nextMonth = new Date(year, monthIdx, 1);
  const prevStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

  const setView = (v: "month" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(`${pathname}?month=${prevStr}&view=${view}`)}
          className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-[180px] text-center font-serif text-xl font-bold">{monthName}</h2>
        <button
          onClick={() => router.push(`${pathname}?month=${nextStr}&view=${view}`)}
          className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push(`${pathname}?view=${view}`)}
          className="ml-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Today
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-md border border-border p-1">
        <button
          onClick={() => setView("month")}
          className={cn(
            "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
            view === "month" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Month
        </button>
        <button
          onClick={() => setView("list")}
          className={cn(
            "flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
            view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="h-3.5 w-3.5" /> List
        </button>
      </div>
    </div>
  );
}
