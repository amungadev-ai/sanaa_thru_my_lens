"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Check } from "lucide-react";
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

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPicker({ open, onClose, onSelect, title = "Select an image" }: MediaPickerProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?page=${page}&per_page=24${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setImages(data.images ?? []);
        setTotalPages(data.total_pages ?? 1);
      }
    } catch {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (open) {
      setPage(1);
      setSearch("");
      setSelectedUrl(null);
      loadImages();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(loadImages, search ? 300 : 0);
      return () => clearTimeout(t);
    }
  }, [open, search, page, loadImages]);

  const handleSelect = () => {
    if (!selectedUrl) {
      toast.error("Select an image first");
      return;
    }
    onSelect(selectedUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
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
            className="pl-10"
          />
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No images found. Upload one first from the Media Library.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-1 sm:grid-cols-4 md:grid-cols-5">
              {images.map((img) => (
                <button
                  key={img.path}
                  onClick={() => setSelectedUrl(img.url)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-md border-2 bg-secondary/30 transition-all hover:shadow-md",
                    selectedUrl === img.url
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  )}
                  title={img.filename}
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* Selected indicator */}
                  {selectedUrl === img.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                  {/* Filename tooltip overlay */}
                  <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.filename}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedUrl}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="mr-2 h-4 w-4" />
            Use this image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
