"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaPicker } from "@/components/media/MediaPicker";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, FolderOpen, Trash2 } from "lucide-react";
import Link from "next/link";

export interface EventEditorData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  category: string;
  venue: string;
  city: string;
  address: string;
  startDate: string;
  endDate: string;
  ticketPrice: string;
  ticketUrl: string;
  eventUrl: string;
  status: "DRAFT" | "PUBLISHED";
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface EventEditorProps {
  initialData: EventEditorData;
  categories: Category[];
  mode: "create" | "edit";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const KENYAN_CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Nyeri", "Meru", "Thika", "Malindi", "Lamu", "Naivasha", "Kitale", "Kakamega", "Kisii"];

export function EventEditor({ initialData, categories, mode }: EventEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<EventEditorData>(initialData);
  const [saving, setSaving] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const update = <K extends keyof EventEditorData>(key: K, value: EventEditorData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async (publish: boolean) => {
    if (!data.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!data.startDate) {
      toast.error("Start date is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...data,
        status: publish ? "PUBLISHED" : data.status,
      };

      const url = mode === "create" ? "/api/events" : `/api/events/${data.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.error ?? `Save failed (HTTP ${res.status})`);
        return;
      }
      toast.success(publish ? "Event published!" : "Event saved");
      router.push("/admin/events");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data.id) return;
    if (!confirm(`Delete "${data.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${data.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Event deleted");
      router.push("/admin/events");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/events" className="rounded-md p-2 text-muted-foreground hover:bg-secondary" title="Back to events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold">{mode === "create" ? "New Event" : "Edit Event"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/10">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-4">
          {/* Title */}
          <Card className="p-5">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
            <input
              id="title"
              type="text"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Event title…"
              className="mt-1 w-full bg-transparent font-serif text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
            />
          </Card>

          {/* Description */}
          <Card className="p-5">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="A short description of the event (1-3 sentences)…"
              rows={3}
              className="mt-1 resize-none"
            />
          </Card>

          {/* Date & venue */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">When & Where</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Start date & time</Label>
                <Input
                  type="datetime-local"
                  value={data.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End date & time (optional)</Label>
                <Input
                  type="datetime-local"
                  value={data.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Venue name</Label>
                <Input
                  value={data.venue}
                  onChange={(e) => update("venue", e.target.value)}
                  placeholder="e.g. KICC, National Museum"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Select value={data.city} onValueChange={(v) => update("city", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYAN_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Address (for maps)</Label>
                <Input
                  value={data.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Full street address for Google Maps"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Tickets */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Tickets & Links</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Ticket price</Label>
                <Input
                  value={data.ticketPrice}
                  onChange={(e) => update("ticketPrice", e.target.value)}
                  placeholder="e.g. KSh 1,500 or Free"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ticket URL (optional)</Label>
                <Input
                  value={data.ticketUrl}
                  onChange={(e) => update("ticketUrl", e.target.value)}
                  placeholder="https://…"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Event website (optional)</Label>
                <Input
                  value={data.eventUrl}
                  onChange={(e) => update("eventUrl", e.target.value)}
                  placeholder="https://…"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Status */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Status</h3>
            <div className="mt-3">
              <Select value={data.status} onValueChange={(v) => update("status", v as "DRAFT" | "PUBLISHED")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Category */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Category</h3>
            <div className="mt-3">
              <Select value={data.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Cover image */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Cover</h3>
              <button
                onClick={() => setShowCoverPicker(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <FolderOpen className="h-3 w-3" /> Browse
              </button>
            </div>
            {data.coverImage && (
              <div className="mt-3 aspect-video overflow-hidden rounded-md border border-border">
                <img src={data.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
              </div>
            )}
            <Input
              value={data.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="/images/covers/… or https://cdn…"
              className="mt-3 font-mono text-xs"
            />
          </Card>

          {/* Slug */}
          <Card className="p-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL slug</Label>
            <Input
              value={data.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              placeholder="auto-generated from title"
              className="mt-1 font-mono text-xs"
            />
            {data.slug && <p className="mt-1 truncate text-[11px] text-muted-foreground">/events/{data.slug}</p>}
          </Card>
        </aside>
      </div>

      {/* Media picker */}
      <MediaPicker
        open={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onSelect={(url) => {
          update("coverImage", url);
          toast.success("Cover image selected");
        }}
        title="Select event cover image"
      />
    </div>
  );
}
