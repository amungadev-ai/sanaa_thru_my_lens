"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { ArticleCard } from "@/components/blog/ArticleCard";
import type { PublicPost } from "@/lib/posts";

interface SearchInputProps {
  posts: PublicPost[];
}

export function SearchInput({ posts }: SearchInputProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts.slice(0, 9);
    return posts.filter((p) => {
      const haystack = `${p.title} ${p.excerpt} ${p.category ?? ""} ${p.tags}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, posts]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category, or keyword…"
          className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
        {query && <> for &ldquo;{query}&rdquo;</>}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-serif text-xl font-bold">No stories found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword, or browse by section instead.
          </p>
        </div>
      )}
    </div>
  );
}
