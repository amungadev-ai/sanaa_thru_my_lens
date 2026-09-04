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
import { Loader2, Pencil, ExternalLink } from "lucide-react";

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

interface EditorCalendarPostDialogProps {
  post?: CalendarPost;
  date?: string;
  onClose: () => void;
}

// Editors can use these statuses (no ARCHIVED — that's admin-only)
const STATUSES = [
  { value: "IDEA", label: "Idea" },
  { value: "DRAFTING", label: "Drafting" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "SCHEDULED", label: "Scheduled" },
];

export function EditorCalendarPostDialog({ post, date, onClose }: EditorCalendarPostDialogProps) {
  const isEditing = !!post;
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(post?.title ?? "");
  const [status, setStatus] = useState(post?.status ?? "IDEA");
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : (date ? `${date}T09:00` : "")
  );
  const [calendarNote, setCalendarNote] = useState(post?.calendarNote ?? "");
  const [saving, setSaving] = useState(false);

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
        const res = await fetch(`/api/editor/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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
        // Quick-add via editor API
        const res = await fetch("/api/editor/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            calendarNote: calendarNote.trim() || null,
            excerpt: "",
            content: "",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit my post" : "Quick add to calendar"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled date</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Planning label — admin publishes.
            </p>
          </div>

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

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {isEditing && post && (
                <>
                  {post.status === "PUBLISHED" && (
                    <Button type="button" variant="ghost" size="sm" asChild>
                      <Link href={`/post/${post.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <Link href={`/editor/posts/${post.id}/edit`}>
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
