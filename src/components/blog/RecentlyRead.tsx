"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Bookmark } from "lucide-react";

interface ReadPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  category: string | null;
  readAt: number; // timestamp
}

const STORAGE_KEY = "st_recently_read";
const MAX_ITEMS = 4;

export function RecentlyRead() {
  const [posts, setPosts] = useState<ReadPost[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ReadPost[] = JSON.parse(stored);
        if (parsed.length > 0) {
          // Schedule state update asynchronously to avoid cascading renders
          requestAnimationFrame(() => setPosts(parsed));
        }
      }
    } catch {
      // localStorage not available or corrupted
    }
  }, []);

  if (posts.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-bold">Recently Read</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Pick up where you left off</p>
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="group flex gap-3"
          >
            <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              {post.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {post.category}
                </span>
              )}
              <h4 className="line-clamp-2 font-serif text-sm font-bold leading-snug group-hover:text-primary">
                {post.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Records a read to localStorage. Called by ReadTracker.
 */
function trackRead(post: {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  category: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let posts: ReadPost[] = stored ? JSON.parse(stored) : [];
    posts = posts.filter((p) => p.id !== post.id);
    posts.unshift({ ...post, readAt: Date.now() });
    posts = posts.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // silent fail
  }
}

/**
 * Client component that records a read on mount.
 * Place at the bottom of article pages.
 */
export function ReadTracker({ post }: { post: { id: string; title: string; slug: string; coverImage: string | null; category: string | null } }) {
  useEffect(() => {
    trackRead(post);
  }, [post.id]);
  return null;
}
