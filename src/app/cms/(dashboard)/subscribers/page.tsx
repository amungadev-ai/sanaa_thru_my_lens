import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Users, Mail, UserCheck, UserX } from "lucide-react";
import { SubscribersTable } from "./SubscribersTable";

export const revalidate = 30; // Cache for 30 seconds

export default async function CmsSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status?.trim() ?? "ACTIVE";

  const [subscribers, stats] = await Promise.all([
    db.subscriber.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
        ...(q ? { email: { contains: q } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.subscriber.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statMap = new Map<string, number>();
  for (const s of stats) statMap.set(s.status, s._count._all);
  const total = (statMap.get("ACTIVE") ?? 0) + (statMap.get("UNSUBSCRIBED") ?? 0);

  const cards = [
    {
      label: "Total Subscribers",
      value: total,
      sub: "All-time signups",
      icon: Users,
    },
    {
      label: "Active",
      value: statMap.get("ACTIVE") ?? 0,
      sub: "Currently receiving emails",
      icon: UserCheck,
    },
    {
      label: "Unsubscribed",
      value: statMap.get("UNSUBSCRIBED") ?? 0,
      sub: "Opted out",
      icon: UserX,
    },
    {
      label: "This Month",
      value: await db.subscriber.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      sub: "New signups",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Subscribers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your newsletter subscriber list for The Weekly Dispatch.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-serif text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Filter + table */}
      <Card className="p-0">
        <div className="border-b border-border p-4">
          <form className="flex flex-wrap items-center gap-3" method="get">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by email…"
              className="flex-1 min-w-[200px] rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
            >
              Filter
            </button>
          </form>
        </div>
        <SubscribersTable
          subscribers={subscribers.map((s) => ({
            id: s.id,
            email: s.email,
            name: s.name ?? "",
            status: s.status,
            source: s.source,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </Card>

      {/* Export note */}
      <Card className="border-primary/30 bg-primary/5 p-5">
        <h3 className="font-serif text-sm font-bold">Need to export your list?</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Your subscriber data is stored in the MySQL database on d7.my-control-panel.com.
          You can export it directly via phpMyAdmin or a SQL query:{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
            SELECT email, name, status, createdAt FROM Subscriber WHERE status = &apos;ACTIVE&apos;
          </code>
        </p>
      </Card>
    </div>
  );
}
