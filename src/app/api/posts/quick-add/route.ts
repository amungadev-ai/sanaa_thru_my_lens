import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { bustPostsCache } from "@/lib/cache-bust";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Quick-add: create a new post as an Idea/Draft from the calendar.
 * Only requires a title. Other fields optional.
 */
export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const slug = slugify(title) + "-" + Date.now().toString(36);
    const status = String(body.status ?? "IDEA");
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const authorId = body.authorId ?? null;
    const calendarNote = body.calendarNote ?? null;

    // Determine author name
    let author = "Sanaa Thrumylens";
    if (authorId) {
      const editor = await db.editor.findUnique({ where: { id: authorId } });
      if (editor) author = editor.name ?? editor.email.split("@")[0];
    }

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt: "",
        content: "",
        category: null,
        tags: "",
        author,
        authorId,
        status,
        scheduledAt,
        calendarNote,
        featured: false,
        readingTime: 1,
        notified: false,
      },
    });

    bustPostsCache();

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e) {
    console.error("POST /api/posts/quick-add error:", e);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
