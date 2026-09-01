"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Star, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  views: number;
  featured: boolean;
  createdAt: string;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function PostsTable({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Delete failed");
        return;
      }
      toast.success("Post deleted");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFeatured = async (post: PostRow) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !post.featured }),
      });
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      toast.success(post.featured ? "Removed from featured" : "Marked as featured");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  };

  if (posts.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="font-serif text-lg font-bold">No posts found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search, or write your first story.
        </p>
        <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/admin/posts/new">New Post</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Views</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {p.featured && (
                    <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-500 text-amber-500" />
                  )}
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="line-clamp-1 font-medium hover:text-primary"
                  >
                    {p.title}
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    p.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatViews(p.views)}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.createdAt}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleToggleFeatured(p)}
                    title={p.featured ? "Unfeature" : "Mark as featured"}
                    className={cn(
                      "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary",
                      p.featured && "text-amber-600"
                    )}
                  >
                    <Star className={cn("h-4 w-4", p.featured && "fill-amber-500")} />
                  </button>
                  {p.status === "PUBLISHED" && (
                    <Link
                      href={`/post/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on site"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    title="Edit"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    disabled={deletingId === p.id}
                    title="Delete"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
