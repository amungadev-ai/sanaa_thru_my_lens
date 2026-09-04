import { getCachedCommentsForModeration } from "@/lib/data-cache";
import { Card } from "@/components/ui/card";
import { CommentsModerationTable } from "./CommentsModerationTable";

export const revalidate = 15;

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter = (sp.filter === "approved" || sp.filter === "all" ? sp.filter : "pending") as "pending" | "approved" | "all";

  const comments = await getCachedCommentsForModeration(filter).catch(() => []);

  const pendingCount = comments.filter((c) => !c.approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate reader comments. First comments need approval — after that, commenters can post freely.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-md border border-border p-1 w-fit">
        {(["pending", "approved", "all"] as const).map((f) => (
          <a
            key={f}
            href={`/admin/comments?filter=${f}`}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "pending" ? `Pending (${pendingCount})` : f === "approved" ? "Approved" : "All"}
          </a>
        ))}
      </div>

      <Card className="p-0">
        <CommentsModerationTable
          filter={filter}
          comments={comments.map((c) => ({
            id: c.id,
            authorName: c.authorName,
            authorType: c.authorType,
            authorEmail: c.authorEmail,
            content: c.content,
            approved: c.approved,
            createdAt: c.createdAt.toISOString(),
            postTitle: c.post.title,
            postSlug: c.post.slug,
            votes: c._count.votes,
          }))}
        />
      </Card>
    </div>
  );
}
