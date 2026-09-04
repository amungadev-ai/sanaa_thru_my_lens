"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, ExternalLink } from "lucide-react";

interface CalendarPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  authorId: string | null;
  author: string;
  scheduledAt: string | null;
  calendarNote: string | null;
  createdAt: string;
}

interface EditorOption {
  id: string;
  name: string | null;
  email: string;
}

interface CalendarPostDialogProps {
  post?: CalendarPost;
  date?: string; // for quick-add
  editors: EditorOption[];
  onClose: () => void;
}

const STATUSES = [
  { value: "IDEA", label: "Idea" },
  { value: "DRAFTING", label: "Drafting" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function CalendarPostDialog({ post, date, editors, onClose }: CalendarPostDialogProps) {
  const isEditing = !!post;
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(post?.title ?? "");
  const [status, setStatus] = useState(post?.status ?? "IDEA");
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : (date ? `${date}T09:00` : "")
  );
  const [assignedEditorId, setAssignedEditorId] = useState(post?.authorId ?? "none");
  const [calendarNote, setCalendarNote] = useState(post?.calendarNote ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (isEditing && post) {
        // Update existing post
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            authorId: assignedEditorId === "none" ? null : assignedEditorId,
            calendarNote: calendarNote.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? "Failed to update");
          return;
        }
        toast.success("Post updated");
      } else {
        // Quick-add: create new post as an Idea
        const res = await fetch("/api/posts/quick-add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            authorId: assignedEditorId === "none" ? null : assignedEditorId,
            calendarNote: calendarNote.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? "Failed to create");
          return;
        }
        toast.success("Post created");
      }
      setOpen(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Post deleted");
      setOpen(false);
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit post" : "Quick add to calendar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Story headline or working title"
              autoFocus
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled date</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Planning label only — admin publishes manually.
            </p>
          </div>

          {/* Assign editor */}
          <div className="space-y-2">
            <Label htmlFor="editor">Assigned editor</Label>
            <Select value={assignedEditorId} onValueChange={setAssignedEditorId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {editors.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name ?? e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar note */}
          <div className="space-y-2">
            <Label htmlFor="note">Calendar note (optional)</Label>
            <Textarea
              id="note"
              value={calendarNote}
              onChange={(e) => setCalendarNote(e.target.value)}
              placeholder="A short note for the calendar"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {isEditing && post && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                  {post.status === "PUBLISHED" && (
                    <Button type="button" variant="ghost" size="sm" asChild>
                      <Link href={`/post/${post.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Save changes" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
