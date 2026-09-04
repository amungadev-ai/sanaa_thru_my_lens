import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentEditor } from "@/lib/editor-auth";
import { bustPostsCache } from "@/lib/cache-bust";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST to approve a comment (admin or post's editor) */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const comment = await db.comment.findUnique({
    where: { id },
    include: { post: { select: { authorId: true } } },
  });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check if admin
  const isAdmin = await isAuthenticated();

  // Check if editor owns the post
  let isPostEditor = false;
  if (!isAdmin) {
    const editor = await getCurrentEditor();
    isPostEditor = !!editor && comment.post.authorId === editor.id;
  }

  if (!isAdmin && !isPostEditor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.comment.update({
    where: { id },
    data: { approved: true },
  });

  // If this is the commenter's first approved comment, mark them
  if (comment.authorType === "READER" && comment.authorId) {
    await db.reader.update({
      where: { id: comment.authorId },
      data: { firstCommentApproved: true },
    }).catch(() => {});
  }

  bustPostsCache();

  return NextResponse.json({ ok: true });
}
