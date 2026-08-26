"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create category");
        return;
      }
      toast.success("Category created");
      setName("");
      setSlug("");
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Posts in this category will become uncategorised.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to delete");
        return;
      }
      toast.success("Category deleted");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      {/* Existing list */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Existing categories ({categories.length})
        </h3>
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(c.id, c.name)}
                disabled={deletingId === c.id}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* New form */}
      <form onSubmit={handleCreate} className="space-y-3 rounded-md border border-border p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          New category
        </h3>
        <div>
          <Label htmlFor="name" className="text-xs">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Film & TV"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="slug" className="text-xs">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="film-tv"
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown on the category page."
            className="mt-1 resize-none"
            rows={3}
          />
        </div>
        <Button type="submit" disabled={creating} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
          Create
        </Button>
      </form>
    </div>
  );
}
