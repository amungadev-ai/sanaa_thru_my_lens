"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Save,
  Eye,
  Loader2,
  Heading2,
  Pilcrow,
  Quote,
  List,
  ListOrdered,
  Link2,
  Bold,
  Italic,
  Image as ImageIcon,
  Wand2,
  Upload,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export interface PostEditorData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  author: string;
  coverImage: string;
  status: "PUBLISHED" | "DRAFT";
  featured: boolean;
  readingTime: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostEditorProps {
  initialData: PostEditorData;
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

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  "Music Reviews": ["#be123c", "#7f1d1d"],
  "Literature": ["#d97706", "#92400e"],
  "Culture & Opinion": ["#059669", "#064e3b"],
  "Scene Reports": ["#7c3aed", "#4c1d95"],
  "Features": ["#57534e", "#292524"],
};

function generateCoverSvg(title: string, category: string, author: string): string {
  const [c1, c2] = CATEGORY_GRADIENTS[category] ?? ["#57534e", "#292524"];
  const W = 1200, H = 800;
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Word-wrap title
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) current = w;
    else if ((current + " " + w).length <= 28) current += " " + w;
    else { lines.push(current); current = w; }
  }
  if (current) lines.push(current);
  const startY = 380 - (lines.length - 1) * 30;
  const tspans = lines.slice(0, 4).map((line, i) =>
    `<tspan x="80" y="${startY + i * 60}">${escape(line)}</tspan>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="white" fill-opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <g transform="translate(80, 80)">
    <rect width="48" height="48" rx="8" fill="white" fill-opacity="0.15"/>
    <text x="24" y="32" font-family="Georgia, serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">ST</text>
  </g>
  <text x="148" y="112" font-family="Georgia, serif" font-size="20" fill="white" fill-opacity="0.85">Sanaa Thrumylens</text>
  <g transform="translate(80, ${startY - 70})">
    <rect width="${category.length * 11 + 32}" height="32" rx="16" fill="white" fill-opacity="0.18"/>
    <text x="16" y="21" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="white" letter-spacing="1.5">${escape(category.toUpperCase())}</text>
  </g>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700" fill="white">${tspans}</text>
  <line x1="80" y1="${H - 130}" x2="180" y2="${H - 130}" stroke="white" stroke-width="2" stroke-opacity="0.6"/>
  <text x="80" y="${H - 90}" font-family="Inter, system-ui, sans-serif" font-size="16" fill="white" fill-opacity="0.9">By ${escape(author)}</text>
  <text x="80" y="${H - 60}" font-family="Inter, system-ui, sans-serif" font-size="13" fill="white" fill-opacity="0.6">sanaathrumylens.co.ke</text>
</svg>`;
}

export function PostEditor({ initialData, categories, mode }: PostEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<PostEditorData>(initialData);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-update slug from title (only in create mode or when autoSlug is on)
  useEffect(() => {
    if (autoSlug) {
      setData((d) => ({ ...d, slug: slugify(d.title) }));
    }
  }, [data.title, autoSlug]);

  // Auto-compute reading time from content
  useEffect(() => {
    const wordCount = data.content
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    setData((d) => ({ ...d, readingTime: minutes }));
  }, [data.content]);

  const update = <K extends keyof PostEditorData>(key: K, value: PostEditorData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  // Insert HTML tag at cursor in content textarea
  const insertTag = (open: string, close: string = "") => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = data.content.slice(0, start);
    const selected = data.content.slice(start, end);
    const after = data.content.slice(end);
    const insertion = selected ? `${open}${selected}${close}` : `${open}${close}`;
    const newContent = before + insertion + after;
    update("content", newContent);
    // Refocus and place cursor after insertion
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleGenerateCover = () => {
    if (!data.title) {
      toast.error("Add a title first");
      return;
    }
    const svg = generateCoverSvg(data.title, data.category || "Features", data.author || "Sanaa Thrumylens");
    // Save SVG to public via API (or just embed as data URL for preview)
    // For simplicity, we'll generate the SVG and POST it to /api/upload as svg
    fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "svg", filename: `${data.slug || slugify(data.title)}.svg`, content: svg }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.url) {
          update("coverImage", res.url);
          toast.success("Cover image generated");
        } else {
          toast.error(res.error ?? "Failed to generate cover");
        }
      })
      .catch(() => toast.error("Network error"));
  };

  /**
   * Upload an image file to the CDN (via the blog's /api/upload proxy)
   * and set it as the cover image.
   */
  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok && result.ok && result.url) {
        update("coverImage", result.url);
        toast.success("Cover uploaded to CDN");
      } else {
        toast.error(result.error ?? "Upload failed");
      }
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploadingCover(false);
      // Reset the input so the same file can be re-selected if needed
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  /**
   * Upload an image to the CDN and insert an <img> tag at the cursor
   * position in the content editor.
   */
  const handleContentImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingContent(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok && result.ok && result.url) {
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        insertTag(`<img src="${result.url}" alt="${alt}" />`);
        toast.success("Image inserted");
      } else {
        toast.error(result.error ?? "Upload failed");
      }
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploadingContent(false);
      if (contentFileInputRef.current) contentFileInputRef.current.value = "";
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!data.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!data.content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!data.slug.trim()) {
      update("slug", slugify(data.title));
    }

    setSaving(true);
    const payload = { ...data, status: publish ? "PUBLISHED" : data.status };

    try {
      const url = mode === "create" ? "/api/posts" : `/api/posts/${data.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      toast.success(publish ? "Published!" : "Saved");
      router.push("/cms/posts");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/cms/posts"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
            title="Back to posts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {mode === "create" ? "New Story" : "Edit Story"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.readingTime} min read · {data.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Eye className="mr-1.5 h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Title */}
          <Card className="p-5">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <input
              id="title"
              type="text"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Give your story a headline…"
              className="mt-1 w-full bg-transparent font-serif text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
            />
          </Card>

          {/* Excerpt */}
          <Card className="p-5">
            <Label htmlFor="excerpt" className="text-xs uppercase tracking-wider text-muted-foreground">
              Excerpt
            </Label>
            <Textarea
              id="excerpt"
              value={data.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder="A short summary that appears under the title on cards and search results."
              className="mt-1 resize-none border-0 bg-transparent px-0 focus-visible:ring-0"
              rows={2}
            />
          </Card>

          {/* Content editor */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2">
              <div className="flex flex-wrap items-center gap-1">
                <EditorButton title="Heading" onClick={() => insertTag("<h2>", "</h2>")}>
                  <Heading2 className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Paragraph" onClick={() => insertTag("<p>", "</p>")}>
                  <Pilcrow className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Bold" onClick={() => insertTag("<strong>", "</strong>")}>
                  <Bold className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Italic" onClick={() => insertTag("<em>", "</em>")}>
                  <Italic className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Quote" onClick={() => insertTag("<blockquote>", "</blockquote>")}>
                  <Quote className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Bullet list" onClick={() => insertTag("<ul>\n  <li>", "</li>\n</ul>")}>
                  <List className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Numbered list" onClick={() => insertTag("<ol>\n  <li>", "</li>\n</ol>")}>
                  <ListOrdered className="h-4 w-4" />
                </EditorButton>
                <EditorButton title="Link" onClick={() => insertTag('<a href="https://">', "</a>")}>
                  <Link2 className="h-4 w-4" />
                </EditorButton>
                <EditorButton
                  title="Upload image to CDN"
                  onClick={() => contentFileInputRef.current?.click()}
                  disabled={uploadingContent}
                >
                  {uploadingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </EditorButton>
                <EditorButton title="Image (manual URL)" onClick={() => insertTag('<img src="" alt="', '" />')}>
                  <ImageIcon className="h-4 w-4" />
                </EditorButton>
                <input
                  ref={contentFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleContentImageUpload(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("write")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${activeTab === "write" ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/60"}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${activeTab === "preview" ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/60"}`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === "write" ? (
              <textarea
                ref={contentRef}
                value={data.content}
                onChange={(e) => update("content", e.target.value)}
                placeholder="<p>Start writing your story in HTML. Use the toolbar above to insert common tags.</p>"
                className="min-h-[500px] w-full resize-y bg-card px-5 py-4 font-mono text-sm leading-relaxed outline-none"
              />
            ) : (
              <div className="max-h-[600px] min-h-[500px] overflow-y-auto bg-card px-5 py-4">
                {data.content ? (
                  <div
                    className="article-prose"
                    dangerouslySetInnerHTML={{ __html: data.content }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Publish box */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Publish</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={data.status}
                  onValueChange={(v) => update("status", v as "PUBLISHED" | "DRAFT")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label className="text-sm font-medium">Featured</Label>
                  <p className="text-xs text-muted-foreground">Spotlight on home page</p>
                </div>
                <Switch
                  checked={data.featured}
                  onCheckedChange={(v) => update("featured", v)}
                />
              </div>
            </div>
          </Card>

          {/* Slug */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL slug</Label>
              <button
                onClick={() => setAutoSlug((v) => !v)}
                className={`text-[10px] font-semibold uppercase ${autoSlug ? "text-primary" : "text-muted-foreground"}`}
              >
                {autoSlug ? "Auto" : "Manual"}
              </button>
            </div>
            <Input
              value={data.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              disabled={autoSlug}
              className="mt-1 font-mono text-xs"
            />
            {data.slug && (
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                /post/{data.slug}
              </p>
            )}
          </Card>

          {/* Category + tags */}
          <Card className="p-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Organize</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select
                  value={data.category}
                  onValueChange={(v) => update("category", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a section…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <Input
                  value={data.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="Music, Kenya, Review"
                  className="mt-1"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Comma-separated</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Author</Label>
                <Input
                  value={data.author}
                  onChange={(e) => update("author", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Cover image */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider">Cover</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateCover}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <Wand2 className="h-3 w-3" /> Auto
                </button>
                <button
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                </button>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            {data.coverImage && (
              <div className="mt-3 aspect-video overflow-hidden rounded-md border border-border">
                <img src={data.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
              </div>
            )}
            <Input
              value={data.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="/images/covers/… or https://cdn.sanaathrumylens.co.ke/…"
              className="mt-3 font-mono text-xs"
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function EditorButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
