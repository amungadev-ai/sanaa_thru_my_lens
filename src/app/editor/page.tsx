import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentEditor } from "@/lib/editor-auth";
import { getCategories } from "@/lib/posts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Clock, Plus, ArrowUpRight } from "lucide-react";
import { formatViews } from "@/lib/posts";

export const revalidate = 30;

import { formatDateSafe } from "@/lib/date-utils";

export default async function EditorDashboardPage() {
  const editor = await getCurrentEditor();
  if (!editor) return null;

  const [posts, totalViews, publishedCount, draftCount] = await Promise.all([
    db.post.findMany({
      where: { authorId: editor.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        category: true,
        views: true,
        createdAt: true,
      },
    }),
    db.post.aggregate({
      where: { authorId: editor.id },
      _sum: { views: true },
    }),
    db.post.count({ where: { authorId: editor.id, status: "PUBLISHED" } }),
    db.post.count({ where: { authorId: editor.id, status: "DRAFT" } }),
  ]);

  const cards = [
    {
      label: "My Stories",
      value: posts.length,
      sub: `${publishedCount} published · ${draftCount} draft`,
      icon: FileText,
    },
    {
      label: "Total Views",
      value: formatViews(totalViews._sum.views ?? 0),
      sub: "Across all my stories",
      icon: Eye,
    },
    {
      label: "Published",
      value: publishedCount,
      sub: "Live on the site",
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">
            Welcome, {editor.name ?? editor.email.split("@")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your editorial dashboard. Write, edit, and publish your stories.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/editor/posts/new">
            <Plus className="mr-2 h-4 w-4" /> New Story
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      {/* Recent posts */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">My Recent Stories</h2>
          <Link href="/editor/posts" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-serif text-lg font-bold">No stories yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Write your first story and share it with the world.
            </p>
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/editor/posts/new">
                <Plus className="mr-2 h-4 w-4" /> Start writing
              </Link>
            </Button>
          </div>
        ) : (
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
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/editor/posts/${p.id}/edit`}
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
        )}
      </Card>

      {/* Quick links */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/editor/posts/new"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">Write a story</p>
              <p className="text-xs text-muted-foreground">Start a new draft</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/editor/profile"
            className="group flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div>
              <p className="font-medium">Edit my profile</p>
              <p className="text-xs text-muted-foreground">Update bio and name</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
