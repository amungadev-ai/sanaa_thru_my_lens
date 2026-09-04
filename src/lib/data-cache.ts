import { unstable_cache } from "next/cache";
import { db, withRetry } from "./db";

/**
 * Data cache layer using Next.js unstable_cache.
 *
 * Unlike in-memory caching (which is per-serverless-instance), unstable_cache
 * uses Vercel's Data Cache — shared across ALL function instances.
 *
 * This means: even if Vercel spins up 50 serverless functions simultaneously,
 * only ONE of them queries MySQL. The other 49 get the cached result.
 *
 * Cache tags allow manual invalidation when data changes (via revalidateTag).
 */

// ─── Public blog data ──────────────────────────────────────────────────

export const getCachedPublishedPosts = unstable_cache(
  async (limit: number, category?: string) => {
    return withRetry(() =>
      db.post.findMany({
        where: {
          status: "PUBLISHED",
          ...(category ? { category } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
  },
  ["published-posts"],
  { revalidate: 300, tags: ["posts"] } // 5 minutes + manual bust
);

export const getCachedFeaturedPost = unstable_cache(
  async () => {
    return withRetry(() =>
      db.post.findFirst({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { createdAt: "desc" },
      })
    );
  },
  ["featured-post"],
  { revalidate: 300, tags: ["posts"] }
);

export const getCachedCategories = unstable_cache(
  async () => {
    return withRetry(() => db.category.findMany({ orderBy: { name: "asc" } }));
  },
  ["categories"],
  { revalidate: 600, tags: ["categories"] } // 10 minutes
);

export const getCachedSubscriberCount = unstable_cache(
  async () => {
    return withRetry(() => db.subscriber.count({ where: { status: "ACTIVE" } }));
  },
  ["subscriber-count"],
  { revalidate: 300, tags: ["subscribers"] } // 5 minutes
);

export const getCachedPostBySlug = unstable_cache(
  async (slug: string) => {
    return withRetry(() => db.post.findUnique({ where: { slug } }));
  },
  ["post-by-slug"],
  { revalidate: 300, tags: ["posts"] }
);

export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => {
    return withRetry(() => db.category.findUnique({ where: { slug } }));
  },
  ["category-by-slug"],
  { revalidate: 600, tags: ["categories"] }
);

export const getCachedPostCountsByCategory = unstable_cache(
  async () => {
    return withRetry(() =>
      db.post.groupBy({
        by: ["category"],
        where: { status: "PUBLISHED" },
        _count: { _all: true },
      })
    );
  },
  ["post-counts-by-category"],
  { revalidate: 300, tags: ["posts"] }
);

// ─── CMS admin data (shorter cache) ────────────────────────────────────

export const getCachedPostStats = unstable_cache(
  async () => {
    const [total, published, draft, totalViews, featuredCount] = await Promise.all([
      withRetry(() => db.post.count()),
      withRetry(() => db.post.count({ where: { status: "PUBLISHED" } })),
      withRetry(() => db.post.count({ where: { status: "DRAFT" } })),
      withRetry(() => db.post.aggregate({ _sum: { views: true } })),
      withRetry(() => db.post.count({ where: { featured: true } })),
    ]);
    return { total, published, draft, totalViews: totalViews._sum.views ?? 0, featuredCount };
  },
  ["post-stats"],
  { revalidate: 30, tags: ["posts"] } // 30 seconds for admin
);

export const getCachedRecentPosts = unstable_cache(
  async (limit: number) => {
    return withRetry(() =>
      db.post.findMany({
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
      })
    );
  },
  ["recent-posts"],
  { revalidate: 15, tags: ["posts"] } // 15 seconds for admin
);

export const getCachedAllPosts = unstable_cache(
  async (q: string, status: string) => {
    return withRetry(() =>
      db.post.findMany({
        where: {
          ...(q ? { title: { contains: q } } : {}),
          ...(status && status !== "all" ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    );
  },
  ["all-posts-admin"],
  { revalidate: 15, tags: ["posts"] }
);

export const getCachedCategoryStats = unstable_cache(
  async () => {
    return withRetry(() =>
      db.post.groupBy({
        by: ["category"],
        _count: { _all: true },
        _sum: { views: true },
        orderBy: { _count: { category: "desc" } },
      })
    );
  },
  ["category-stats"],
  { revalidate: 30, tags: ["posts"] }
);

export const getCachedAllSubscribers = unstable_cache(
  async (status: string, q: string) => {
    return withRetry(() =>
      db.subscriber.findMany({
        where: {
          ...(status && status !== "all" ? { status } : {}),
          ...(q ? { email: { contains: q } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      })
    );
  },
  ["all-subscribers-admin"],
  { revalidate: 30, tags: ["subscribers"] }
);

export const getCachedSubscriberStats = unstable_cache(
  async () => {
    return withRetry(() =>
      db.subscriber.groupBy({
        by: ["status"],
        _count: { _all: true },
      })
    );
  },
  ["subscriber-stats"],
  { revalidate: 30, tags: ["subscribers"] }
);

export const getCachedAllEditors = unstable_cache(
  async () => {
    return withRetry(() =>
      db.editor.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { posts: true } } },
      })
    );
  },
  ["all-editors"],
  { revalidate: 30, tags: ["editors"] }
);

export const getCachedEditorStats = unstable_cache(
  async () => {
    return withRetry(() =>
      db.editor.groupBy({
        by: ["status"],
        _count: { _all: true },
      })
    );
  },
  ["editor-stats"],
  { revalidate: 30, tags: ["editors"] }
);

export const getCachedAllCategories = unstable_cache(
  async () => {
    return withRetry(() => db.category.findMany({ orderBy: { name: "asc" } }));
  },
  ["all-categories-admin"],
  { revalidate: 60, tags: ["categories"] }
);

export const getCachedCategoryCounts = unstable_cache(
  async () => {
    return withRetry(() =>
      db.post.groupBy({
        by: ["category"],
        _count: { _all: true },
      })
    );
  },
  ["category-counts-admin"],
  { revalidate: 60, tags: ["posts"] }
);

export const getCachedSiteSettings = unstable_cache(
  async () => {
    return withRetry(() => db.siteSettings.findUnique({ where: { id: "default" } }));
  },
  ["site-settings"],
  { revalidate: 60, tags: ["settings"] }
);

export const getCachedAdminUser = unstable_cache(
  async () => {
    return withRetry(() => db.adminUser.findFirst());
  },
  ["admin-user"],
  { revalidate: 60, tags: ["settings"] }
);

// ─── Calendar queries ─────────────────────────────────────────────────

export const getCachedCalendarPosts = unstable_cache(
  async (monthStart: string, monthEnd: string) => {
    return withRetry(() =>
      db.post.findMany({
        where: {
          OR: [
            // Posts scheduled in this month
            { scheduledAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
            // Posts published in this month
            { status: "PUBLISHED", createdAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
            // Ideas/drafts assigned in this month (by createdAt)
            { status: { in: ["IDEA", "DRAFTING"] }, createdAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
          ],
        },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          category: true,
          authorId: true,
          author: true,
          scheduledAt: true,
          calendarNote: true,
          createdAt: true,
        },
      })
    );
  },
  ["calendar-posts"],
  { revalidate: 15, tags: ["posts"] }
);

export const getCachedEditorCalendarPosts = unstable_cache(
  async (editorId: string, monthStart: string, monthEnd: string) => {
    return withRetry(() =>
      db.post.findMany({
        where: {
          authorId: editorId,
          OR: [
            { scheduledAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
            { status: "PUBLISHED", createdAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
            { status: { in: ["IDEA", "DRAFTING"] }, createdAt: { gte: new Date(monthStart), lte: new Date(monthEnd) } },
          ],
        },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          category: true,
          authorId: true,
          author: true,
          scheduledAt: true,
          calendarNote: true,
          createdAt: true,
        },
      })
    );
  },
  ["editor-calendar-posts"],
  { revalidate: 15, tags: ["posts"] }
);

export const getCachedAllEditorsForAssignment = unstable_cache(
  async () => {
    return withRetry(() =>
      db.editor.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      })
    );
  },
  ["editors-for-assignment"],
  { revalidate: 30, tags: ["editors"] }
);
