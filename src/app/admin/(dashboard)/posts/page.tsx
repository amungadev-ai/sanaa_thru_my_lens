import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getCachedAllPosts } from "@/lib/data-cache";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostsTable } from "./PostsTable";

export const revalidate = 15;

import { formatDateSafe } from "@/lib/date-utils";

export default async function CmsPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status?.trim() ?? "";

  const posts = await getCachedAllPosts(q, status).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"} in the library.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>

      {/* Filter form */}
      <form className="flex flex-wrap items-center gap-3" method="get">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by title…"
            className="w-full rounded-md border border-border bg-card py-2 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          name="status"
          defaultValue={status || "all"}
          className="rounded-md border border-border bg-card py-2 pl-3 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <Card className="p-0">
        <PostsTable posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          category: p.category,
          views: p.views,
          featured: p.featured,
          createdAt: formatDateSafe(p.createdAt),
        }))} />
      </Card>
    </div>
  );
}
