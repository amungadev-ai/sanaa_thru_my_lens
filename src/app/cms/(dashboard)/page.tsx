import Link from "next/link";
import { FileText, Eye, Star, Users, ArrowUpRight } from "lucide-react";
import {
  getCachedPostStats,
  getCachedRecentPosts,
  getCachedCategoryStats,
  getCachedSubscriberCount,
} from "@/lib/data-cache";
import { formatViews } from "@/lib/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { formatDateSafe } from "@/lib/date-utils";

export const revalidate = 30;

export default async function CmsDashboardPage() {
  // All queries use cross-instance cache with graceful fallback
  const [stats, recent, categoryStats, subscriberCount] = await Promise.all([
    getCachedPostStats().catch(() => ({ total: 0, published: 0, draft: 0, totalViews: 0, featuredCount: 0 })),
    getCachedRecentPosts(6).catch(() => []),
    getCachedCategoryStats().catch(() => []),
    getCachedSubscriberCount().catch(() => 0),
  ]);

  const cards = [
    {
      label: "Total Posts",
      value: stats.total,
      sub: `${stats.published} published · ${stats.draft} draft`,
      icon: FileText,
    },
    {
      label: "Total Views",
      value: formatViews(stats.totalViews),
      sub: "Across all published stories",
      icon: Eye,
    },
    {
      label: "Subscribers",
      value: subscriberCount,
      sub: "Active on The Weekly Dispatch",
      icon: Users,
    },
    {
      label: "Featured",
      value: stats.featuredCount,
      sub: "Currently spotlighted",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, editor. Here&apos;s what&apos;s happening with Sanaa Thrumylens.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/cms/posts/new">
            <FileText className="mr-2 h-4 w-4" /> Write a new story
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="mt-2 font-serif text-3xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent posts + categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Recent posts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Recent Posts</h2>
            <Link href="/cms/posts" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Views</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/cms/posts/${p.id}/edit`}
                        className="line-clamp-1 font-medium hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      {p.category && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{p.category}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          p.status === "PUBLISHED"
                            ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatViews(p.views)}</td>
                    <td className="py-3 text-muted-foreground">{formatDateSafe(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Category breakdown */}
        <Card className="p-6">
          <h2 className="font-serif text-lg font-bold">By Section</h2>
          <p className="mt-1 text-xs text-muted-foreground">Posts and views per category.</p>
          <ul className="mt-4 space-y-3">
            {categoryStats.map((c) => (
              <li key={c.category ?? "Uncategorised"}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.category ?? "Uncategorised"}</span>
                  <span className="text-muted-foreground">{c._count._all} posts</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {formatViews(c._sum.views ?? 0)} views
                </div>
              </li>
            ))}
            {categoryStats.length === 0 && (
              <li className="text-sm text-muted-foreground">No posts yet.</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Quick links */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/cms/posts/new"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">Write a story</p>
              <p className="text-xs text-muted-foreground">Start a new draft</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/cms/posts"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">Manage posts</p>
              <p className="text-xs text-muted-foreground">Edit, publish, delete</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/cms/categories"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">Edit sections</p>
              <p className="text-xs text-muted-foreground">Categories &amp; tags</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/cms/subscribers"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">View subscribers</p>
              <p className="text-xs text-muted-foreground">{subscriberCount} active readers</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
