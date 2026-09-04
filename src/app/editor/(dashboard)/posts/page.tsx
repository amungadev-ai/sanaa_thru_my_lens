import { toISOStringSafe } from "@/lib/date-utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentEditor } from "@/lib/editor-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditorPostsTable } from "./EditorPostsTable";

export const revalidate = 30;

export default async function EditorPostsPage() {
  const editor = await getCurrentEditor();
  if (!editor) return null;

  const posts = await db.post.findMany({
    where: { authorId: editor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      views: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Stories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? "story" : "stories"} by you.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/editor/posts/new">
            <Plus className="mr-2 h-4 w-4" /> New Story
          </Link>
        </Button>
      </div>

      <Card className="p-0">
        <EditorPostsTable
          posts={posts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            status: p.status,
            category: p.category,
            views: p.views,
            createdAt: toISOStringSafe(p.createdAt),
          }))}
        />
      </Card>
    </div>
  );
}
