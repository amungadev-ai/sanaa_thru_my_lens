"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";

interface CommentRow {
  id: string;
  authorName: string;
  authorType: string;
  authorEmail: string;
  content: string;
  approved: boolean;
  createdAt: string;
  postTitle: string;
  postSlug: string;
  votes: number;
}

export function CommentsModerationTable({ comments, filter = "pending" }: { comments: CommentRow[]; filter?: string }) {
  const router = useRouter();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/comments/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to approve");
        return;
      }
      toast.success("Comment approved");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment permanently?")) return;
    setActionId(id);
    try {
      // Use the admin delete endpoint (we'll need to add auth check)
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Comment deleted");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="font-serif text-lg font-bold">
          {filter === "pending" ? "No comments awaiting moderation 🎉" : "No comments found"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filter === "pending"
            ? "You're all caught up. New comments will appear here."
            : "Try a different filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {comments.map((c) => (
        <div key={c.id} className={cn("p-4 hover:bg-secondary/20", !c.approved && "bg-amber-50/50")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Author info */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.authorName}</span>
                {(c.authorType === "EDITOR" || c.authorType === "ADMIN") && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    {c.authorType === "EDITOR" ? "Editor" : "Author"}
                  </span>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{c.authorEmail}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{formatDateSafe(c.createdAt)}</span>
              </div>

              {/* Comment content */}
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{c.content}</p>

              {/* Post link */}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <Link href={`/post/${c.postSlug}`} target="_blank" className="hover:text-primary">
                  On "{c.postTitle}" <ExternalLink className="ml-0.5 inline h-3 w-3" />
                </Link>
                {c.votes > 0 && <span>· {c.votes} upvote{c.votes !== 1 ? "s" : ""}</span>}
                {!c.approved && (
                  <span className="font-semibold text-amber-600">· Awaiting moderation</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 gap-1">
              {!c.approved && (
                <button
                  onClick={() => handleApprove(c.id)}
                  disabled={actionId === c.id}
                  title="Approve"
                  className="rounded-md p-2 text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                >
                  {actionId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                disabled={actionId === c.id}
                title="Delete"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {actionId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
