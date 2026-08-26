/**
 * Server-side helpers for fetching posts / categories.
 */
import { db } from "./db";

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string | null;
  tags: string;
  author: string;
  views: number;
  readingTime: number;
  createdAt: Date;
  featured: boolean;
}

export function toPublicPost(p: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string | null;
  tags: string;
  author: string;
  views: number;
  readingTime: number;
  createdAt: Date;
  featured: boolean;
}): PublicPost {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    category: p.category,
    tags: p.tags,
    author: p.author,
    views: p.views,
    readingTime: p.readingTime,
    createdAt: p.createdAt,
    featured: p.featured,
  };
}

export async function getPublishedPosts(opts?: { limit?: number; category?: string }): Promise<PublicPost[]> {
  const posts = await db.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(opts?.category ? { category: opts.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
  });
  return posts.map(toPublicPost);
}

export async function getFeaturedPost(): Promise<PublicPost | null> {
  const post = await db.post.findFirst({
    where: { status: "PUBLISHED", featured: true },
    orderBy: { createdAt: "desc" },
  });
  if (post) return toPublicPost(post);
  // Fallback to most recent published post
  const latest = await db.post.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  return latest ? toPublicPost(latest) : null;
}

export async function getPostBySlug(slug: string) {
  const post = await db.post.findUnique({ where: { slug } });
  return post;
}

export async function getRelatedPosts(post: { id: string; category: string | null }, limit = 3) {
  const where = post.category
    ? { status: "PUBLISHED" as const, category: post.category, NOT: { id: post.id } }
    : { status: "PUBLISHED" as const, NOT: { id: post.id } };
  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return posts.map(toPublicPost);
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getPostStats() {
  const [total, published, draft, totalViews, featuredCount] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.post.count({ where: { status: "DRAFT" } }),
    db.post.aggregate({ _sum: { views: true } }),
    db.post.count({ where: { featured: true } }),
  ]);
  return {
    total,
    published,
    draft,
    totalViews: totalViews._sum.views ?? 0,
    featuredCount,
  };
}

export async function getRecentPosts(limit = 5) {
  return db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      views: true,
      category: true,
      createdAt: true,
      featured: true,
    },
  });
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function tagsList(tags: string): string[] {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}
