"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ThumbsUp, Reply, Edit, Trash2, LogIn, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplyData {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  hasVoted: boolean;
  canEdit: boolean;
}

interface CommentData {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  votes: number;
  hasVoted: boolean;
  canEdit: boolean;
  replies: ReplyData[];
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function getAvatarColor(authorType: string): string {
  switch (authorType) {
    case "EDITOR": return "bg-emerald-600 text-white";
    case "ADMIN": return "bg-primary text-primary-foreground";
    default: return "bg-stone-400 text-white";
  }
}

export function CommentSection({ postId, commentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "oldest" | "top">("newest");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Check if logged in
  useEffect(() => {
    fetch("/api/comment-auth/check", { method: "GET" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.ok) {
          setIsLoggedIn(true);
          setCurrentName(data.name);
        }
      })
      .catch(() => {});
  }, []);

  // Load comments
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}&sort=${sort}`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [postId, sort]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: newComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to comment");
        return;
      }
      if (data.comment.approved) {
        toast.success("Comment posted!");
        setNewComment("");
        loadComments();
      } else {
        toast.info("Your comment is awaiting moderation. It will appear once approved.");
        setNewComment("");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: replyContent, parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reply");
        return;
      }
      if (data.comment.approved) {
        toast.success("Reply posted!");
        setReplyContent("");
        setReplyingTo(null);
        loadComments();
      } else {
        toast.info("Your reply is awaiting moderation.");
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.info("Log in to vote");
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, { method: "POST" });
      if (res.ok) {
        loadComments();
      }
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        toast.success("Comment edited");
        setEditingId(null);
        setEditContent("");
        loadComments();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to edit");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete your comment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Comment deleted");
        loadComments();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <MessageCircle className="h-6 w-6 text-primary" />
        Comments {commentCount > 0 && <span className="text-lg text-muted-foreground">({commentCount})</span>}
      </h2>

      {/* Comment box */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex gap-3">
            <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold", getAvatarColor("READER"))}>
              {getInitials(currentName || "R")}
            </div>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this story…"
                rows={3}
                className="resize-none"
                maxLength={2000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{newComment.length}/2000</span>
                <Button type="submit" disabled={!newComment.trim() || posting} size="sm">
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-5">
          <LogIn className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <p className="flex-1 text-sm text-muted-foreground">
            <Link href="/comment-login" className="font-medium text-primary hover:underline">Log in</Link>
            {" "}or{" "}
            <Link href="/comment-register" className="font-medium text-primary hover:underline">register</Link>
            {" "}to join the conversation.
          </p>
        </div>
      )}

      {/* Sort tabs */}
      {comments.length > 0 && (
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Sort:</span>
          {(["newest", "oldest", "top"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sort === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "Most liked"}
            </button>
          ))}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="mt-6 flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground py-8">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <CommentItem
                comment={comment}
                isLoggedIn={isLoggedIn}
                onVote={() => handleVote(comment.id)}
                onReply={() => {
                  if (!isLoggedIn) { toast.info("Log in to reply"); return; }
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyContent("");
                }}
                onEdit={() => {
                  setEditingId(comment.id);
                  setEditContent(comment.content);
                }}
                onDelete={() => handleDelete(comment.id)}
                editing={editingId === comment.id}
                editContent={editContent}
                setEditContent={setEditContent}
                onEditSave={() => handleEdit(comment.id)}
                onEditCancel={() => setEditingId(null)}
              />

              {/* Reply form */}
              {replyingTo === comment.id && isLoggedIn && (
                <div className="ml-12 mt-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.authorName}…`}
                    rows={2}
                    className="resize-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyContent.trim() || posting}>
                      {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post reply"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-12 mt-3 space-y-3 border-l-2 border-border pl-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={{
                        ...reply,
                        votes: 0,
                        replies: [],
                      }}
                      isLoggedIn={isLoggedIn}
                      onVote={() => handleVote(reply.id)}
                      isReply
                      onEdit={() => {
                        setEditingId(reply.id);
                        setEditContent(reply.content);
                      }}
                      onDelete={() => handleDelete(reply.id)}
                      editing={editingId === reply.id}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      onEditSave={() => handleEdit(reply.id)}
                      onEditCancel={() => setEditingId(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: CommentData;
  isLoggedIn: boolean;
  onVote: () => void;
  onReply?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isReply?: boolean;
  editing: boolean;
  editContent: string;
  setEditContent: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

function CommentItem({
  comment,
  isLoggedIn,
  onVote,
  onReply,
  onEdit,
  onDelete,
  isReply,
  editing,
  editContent,
  setEditContent,
  onEditSave,
  onEditCancel,
}: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold", getAvatarColor(comment.authorType))}>
        {getInitials(comment.authorName)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{comment.authorName}</span>
          {(comment.authorType === "EDITOR" || comment.authorType === "ADMIN") && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
              {comment.authorType === "EDITOR" ? "Editor" : "Author"}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>

        {editing ? (
          <div className="mt-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <div className="mt-1 flex gap-2">
              <Button size="sm" variant="outline" onClick={onEditCancel}>Cancel</Button>
              <Button size="sm" onClick={onEditSave}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
        )}

        {/* Actions */}
        {!editing && (
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={onVote}
              className={cn(
                "flex items-center gap-1 transition-colors hover:text-foreground",
                comment.hasVoted && "text-primary"
              )}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", comment.hasVoted && "fill-primary")} />
              {comment.votes > 0 && comment.votes}
            </button>
            {!isReply && onReply && (
              <button onClick={onReply} className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
            {comment.canEdit && (
              <>
                <button onClick={onEdit} className="flex items-center gap-1 transition-colors hover:text-foreground">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={onDelete} className="flex items-center gap-1 transition-colors hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
