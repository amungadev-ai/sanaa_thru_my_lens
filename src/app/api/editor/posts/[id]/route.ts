import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentEditor } from "@/lib/editor-auth";
import { notifySubscribersOfNewPost } from "@/lib/notify-subscribers";

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

/** GET — fetch a single post owned by the current editor */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.authorId !== editor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

/** PUT — update a post owned by the current editor */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.post.findUnique({ where: { id } });
  if (!existing || existing.authorId !== editor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // If slug is changing, validate uniqueness
    const newSlug = body.slug ? slugify(String(body.slug)) : existing.slug;
    if (newSlug !== existing.slug) {
      const conflict = await db.post.findUnique({ where: { slug: newSlug } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
      }
    }

    const content = body.content !== undefined ? String(body.content) : existing.content;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = String(body.title);
    if (body.slug !== undefined) data.slug = newSlug;
    if (body.excerpt !== undefined) data.excerpt = String(body.excerpt);
    if (body.content !== undefined) {
      data.content = String(body.content);
      data.readingTime = estimateReadingTime(content);
    }
    if (body.category !== undefined) data.category = body.category || null;
    if (body.tags !== undefined) data.tags = String(body.tags);
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.status !== undefined) {
      data.status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    }
    // Editors cannot change featured status or author

    const updated = await db.post.update({ where: { id }, data });

    // If post just transitioned to PUBLISHED, notify subscribers
    const wasDraft = existing.status !== "PUBLISHED";
    const isNowPublished = (data.status as string) === "PUBLISHED";
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
    console.error("PUT /api/editor/posts/[id] error:", e);
    return NextResponse.json({ error: "Failed to update post." }, { status: 500 });
  }
}

/** DELETE — delete a post owned by the current editor */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.post.findUnique({ where: { id } });
  if (!existing || existing.authorId !== editor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await db.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
