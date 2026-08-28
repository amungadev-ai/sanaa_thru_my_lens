import { revalidateTag } from "next/cache";

/**
 * Cache invalidation helpers.
 * Call these after data mutations to ensure fresh data on next request.
 */

export function bustPostsCache() {
  revalidateTag("posts");
}

export function bustCategoriesCache() {
  revalidateTag("categories");
}

export function bustSubscribersCache() {
  revalidateTag("subscribers");
}

export function bustEditorsCache() {
  revalidateTag("editors");
}

export function bustSettingsCache() {
  revalidateTag("settings");
}

/** Bust all caches — use after major data imports */
export function bustAllCaches() {
  revalidateTag("posts");
  revalidateTag("categories");
  revalidateTag("subscribers");
  revalidateTag("editors");
  revalidateTag("settings");
}
