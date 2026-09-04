import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCommenter } from "@/lib/commenter-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST to upvote a comment (toggle — clicking again removes the vote) */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const commenter = await getCurrentCommenter();
  if (!commenter) {
    return NextResponse.json({ error: "You must be logged in to vote." }, { status: 401 });
  }

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment || !comment.approved) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check if already voted
  const existing = await db.commentVote.findUnique({
    where: {
      commentId_voterType_voterId: {
        commentId: id,
        voterType: commenter.type,
        voterId: commenter.id,
      },
    },
  });

  if (existing) {
    // Remove vote (toggle)
    await db.commentVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, voted: false });
  }

  // Add vote
  await db.commentVote.create({
    data: {
      commentId: id,
      voterType: commenter.type,
      voterId: commenter.id,
    },
  });

  return NextResponse.json({ ok: true, voted: true });
}
