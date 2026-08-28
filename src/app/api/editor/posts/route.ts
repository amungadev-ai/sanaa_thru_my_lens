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

/** GET — list the current editor's posts */
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { authorId: editor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      views: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ posts });
}

/** POST — create a new post owned by the current editor */
export async function POST(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const slug = String(body.slug ?? "").trim() || slugify(title);
    const content = String(body.content ?? "");
    const excerpt = String(body.excerpt ?? "").trim();

    // Check slug uniqueness
    const existing = await db.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
    }

    const authorName = editor.name ?? editor.email.split("@")[0];

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category: body.category ?? null,
        tags: String(body.tags ?? ""),
        author: authorName,
        authorId: editor.id,
        coverImage: body.coverImage ?? null,
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        featured: false, // editors can't self-feature
        readingTime: estimateReadingTime(content),
      },
    });

    // If published, notify subscribers (non-blocking)
    if (post.status === "PUBLISHED") {
      notifySubscribersOfNewPost({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        category: post.category,
        author: post.author,
      }).catch((e) => console.error("Subscriber notification failed:", e));
    }

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e) {
    console.error("POST /api/editor/posts error:", e);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
