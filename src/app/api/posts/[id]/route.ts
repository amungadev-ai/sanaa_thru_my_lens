import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { notifySubscribersOfNewPost } from "@/lib/notify-subscribers";
import { bustPostsCache } from "@/lib/cache-bust";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await db.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body = await req.json();

    // If title or slug is changing, validate slug uniqueness
    const newSlug = body.slug ? String(body.slug).trim() : existing.slug;
    if (newSlug !== existing.slug) {
      const conflict = await db.post.findUnique({ where: { slug: newSlug } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
      }
    }

    const content = body.content !== undefined ? String(body.content) : existing.content;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = String(body.title);
    if (body.slug !== undefined) data.slug = slugify(String(body.slug));
    if (body.excerpt !== undefined) data.excerpt = String(body.excerpt);
    if (body.content !== undefined) {
      data.content = String(body.content);
      data.readingTime = estimateReadingTime(content);
    }
    if (body.category !== undefined) data.category = body.category || null;
    if (body.tags !== undefined) data.tags = String(body.tags);
    if (body.author !== undefined) data.author = String(body.author);
    if (body.authorId !== undefined) data.authorId = body.authorId || null;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.status !== undefined) {
      // Accept all 6 statuses
      const validStatuses = ["IDEA", "DRAFTING", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED", "DRAFT"];
      data.status = validStatuses.includes(String(body.status)) ? String(body.status) : existing.status;
    }
    if (body.scheduledAt !== undefined) {
      data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (body.calendarNote !== undefined) data.calendarNote = body.calendarNote || null;
    if (body.featured !== undefined) data.featured = Boolean(body.featured);

    // If authorId changed, update the author name too
    if (body.authorId !== undefined) {
      const newAuthorId = body.authorId || null;
      if (newAuthorId) {
        const editor = await db.editor.findUnique({ where: { id: newAuthorId } });
        if (editor) data.author = editor.name ?? editor.email.split("@")[0];
      }
    }

    const updated = await db.post.update({ where: { id }, data });

    // If post just transitioned to PUBLISHED and hasn't been notified yet,
    // send subscriber notifications (non-blocking)
    const wasDraft = existing.status !== "PUBLISHED";
    const isNowPublished = (data.status as string) === "PUBLISHED" || (existing.status === "PUBLISHED" && !data.status);
    const notYetNotified = !existing.notified;

    if (wasDraft && isNowPublished && notYetNotified) {
      notifySubscribersOfNewPost({
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        coverImage: updated.coverImage,
        category: updated.category,
        author: updated.author,
      }).catch((e) => console.error("Subscriber notification failed:", e));
    }

    return NextResponse.json({ ok: true, post: updated });
  } catch (e) {
    console.error("PUT /api/posts/[id] error:", e);
    return NextResponse.json({ error: "Failed to update post." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.post.delete({ where: { id } });
    bustPostsCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Post not found or already deleted." }, { status: 404 });
  }
}
