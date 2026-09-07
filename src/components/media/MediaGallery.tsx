"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Search,
  Upload,
  Copy,
  ExternalLink,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaImage {
  path: string;
  url: string;
  filename: string;
  size: number;
  modified: string;
  extension: string;
  usedIn: number;
}

interface MediaGalleryProps {
  canDelete: boolean; // admin = true, editor = false
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MediaGallery({ canDelete }: MediaGalleryProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailImage, setDetailImage] = useState<MediaImage | null>(null);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [fileInputRef] = useState<HTMLInputElement | null>(null) as any;

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?page=${page}&per_page=24${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setImages(data.images ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      } else {
        toast.error(data.error ?? "Failed to load images");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(loadImages, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Image uploaded");
        loadImages();
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (path: string, filename: string) => {
    if (!canDelete) return;
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media?path=${encodeURIComponent(path)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Image deleted");
        setSelected(new Set());
        loadImages();
        if (detailImage?.path === path) setDetailImage(null);
      } else {
        toast.error(data.error ?? "Delete failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} images? This cannot be undone.`)) return;
    setDeleting(true);
    let success = 0;
    let failed = 0;
    for (const path of selected) {
      try {
        const res = await fetch(`/api/media?path=${encodeURIComponent(path)}`, { method: "DELETE" });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    toast.success(`${success} deleted${failed > 0 ? `, ${failed} failed` : ""}`);
    setSelected(new Set());
    setDeleting(false);
    loadImages();
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("URL copied");
      setTimeout(() => setCopiedUrl(""), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const toggleSelect = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by filename…"
              className="w-64 pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "image" : "images"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete {selected.size}
            </Button>
          )}
          <Button
            onClick={() => fileInputRef?.click()}
            disabled={uploading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Gallery grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-serif text-lg font-bold">
            {search ? "No images match your search" : "No images yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Try a different search term." : "Upload your first image using the Upload button."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <Card
              key={img.path}
              className={cn(
                "group relative cursor-pointer overflow-hidden p-0 transition-all hover:shadow-md",
                selected.has(img.path) && "ring-2 ring-primary"
              )}
              onClick={() => setDetailImage(img)}
            >
              {/* Selection checkbox (admin only) */}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(img.path);
                  }}
                  className={cn(
                    "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 bg-white/90 transition-all",
                    selected.has(img.path)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                >
                  {selected.has(img.path) && <Check className="h-3 w-3" />}
                </button>
              )}

              {/* Image thumbnail */}
              <div className="aspect-square overflow-hidden bg-secondary/30">
                <img
                  src={img.url}
                  alt={img.filename}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Filename + info */}
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={img.filename}>
                  {img.filename}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>{formatSize(img.size)}</span>
                  {img.usedIn > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1 py-0.5 font-medium text-emerald-700">
                      {img.usedIn} use{img.usedIn !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail modal */}
      {detailImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetailImage(null)}
        >
          <Card
            className="max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex">
              {/* Preview */}
              <div className="flex-1 bg-secondary/30 p-4">
                <img
                  src={detailImage.url}
                  alt={detailImage.filename}
                  className="mx-auto max-h-96 max-w-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="w-72 space-y-4 border-l border-border p-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-lg font-bold leading-tight">
                    {detailImage.filename}
                  </h3>
                  <button
                    onClick={() => setDetailImage(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Size: </span>
                    <span className="font-medium">{formatSize(detailImage.size)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uploaded: </span>
                    <span className="font-medium">{formatDate(detailImage.modified)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-medium uppercase">{detailImage.extension}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Usage: </span>
                    {detailImage.usedIn > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        In {detailImage.usedIn} post{detailImage.usedIn !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not used in any post</span>
                    )}
                  </div>
                </div>

                {/* URL with copy button */}
                <div>
                  <span className="block text-xs text-muted-foreground">CDN URL</span>
                  <div className="mt-1 flex gap-1">
                    <Input
                      value={detailImage.url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(detailImage.url)}
                    >
                      {copiedUrl === detailImage.url ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a href={detailImage.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open full size
                    </a>
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDelete(detailImage.path, detailImage.filename)}
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete image
                    </Button>
                  )}
                </div>

                {/* Usage warning */}
                {canDelete && detailImage.usedIn > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      This image is used in {detailImage.usedIn} post{detailImage.usedIn !== 1 ? "s" : ""}.
                      Deleting it will break the image in those posts.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
