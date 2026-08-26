"use client";

import { useEffect } from "react";

/**
 * Fires a POST to /api/posts/[slug]/view once per page mount.
 * Increments the post view counter without blocking render.
 */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    // Avoid double counting on React Strict Mode in dev
    const key = `viewed_${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {
      // Silent failure — view tracking is best-effort
    });
  }, [postId]);

  return null;
}
