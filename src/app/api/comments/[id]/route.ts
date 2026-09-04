import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCommenter } from "@/lib/commenter-auth";
import { bustPostsCache } from "@/lib/cache-bust";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** DELETE a comment (by the author, within edit window, or by admin/editor) */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const commenter = await getCurrentCommenter();
  if (!commenter) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check ownership
  const isOwner = comment.authorId === commenter.id && comment.authorType === commenter.type;
  if (!isOwner) {
    return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
  }

  // Delete comment and replies (cascade)
  await db.comment.delete({ where: { id } });

  // Decrement post comment count
  await db.post.update({
    where: { id: comment.postId },
    data: { commentCount: { decrement: 1 } },
  }).catch(() => {});

  bustPostsCache();

  return NextResponse.json({ ok: true });
}

/** PUT to edit a comment (within 15 min window) */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const commenter = await getCurrentCommenter();
  if (!commenter) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isOwner = comment.authorId === commenter.id && comment.authorType === commenter.type;
  if (!isOwner) {
    return NextResponse.json({ error: "You can only edit your own comments." }, { status: 403 });
  }

  // 15-minute edit window
  const editWindowMs = 15 * 60 * 1000;
  if (Date.now() - comment.createdAt.getTime() > editWindowMs) {
    return NextResponse.json({ error: "Edit window has expired (15 min)." }, { status: 403 });
  }

  const body = await req.json();
  const content = String(body.content ?? "").slice(0, 2000).trim();
  if (content.length < 5) {
    return NextResponse.json({ error: "Comment too short." }, { status: 400 });
  }

  const updated = await db.comment.update({
    where: { id },
    data: { content, isEdited: true },
  });

  return NextResponse.json({ ok: true, comment: { id: updated.id, content: updated.content } });
}
