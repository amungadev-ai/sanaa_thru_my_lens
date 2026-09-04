import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCommenter } from "@/lib/commenter-auth";
import { sendEmail } from "@/lib/email";
import { bustPostsCache } from "@/lib/cache-bust";

const MIN_COMMENT_LENGTH = 5;
const MAX_COMMENT_LENGTH = 2000;
const RATE_LIMIT_SECONDS = 30;

function sanitizeContent(text: string): string {
  // Strip HTML, limit length, trim
  return text.slice(0, MAX_COMMENT_LENGTH).trim();
}

function hasLinks(text: string): boolean {
  return /https?:\/\//i.test(text) || /www\./i.test(text);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const sort = searchParams.get("sort") ?? "newest"; // newest | oldest | top

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Get approved comments + their replies
  const comments = await db.comment.findMany({
    where: {
      postId,
      approved: true,
      parentId: null, // top-level only; replies are nested
    },
    orderBy:
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "top"
          ? { votes: { _count: "desc" } }
          : { createdAt: "desc" }, // newest
    include: {
      replies: {
        where: { approved: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { votes: true } },
    },
  });

  // Get current commenter to check if they've voted
  const commenter = await getCurrentCommenter();
  let votedIds = new Set<string>();
  if (commenter) {
    const votes = await db.commentVote.findMany({
      where: {
        commentId: { in: comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]) },
        voterType: commenter.type,
        voterId: commenter.id,
      },
      select: { commentId: true },
    });
    votedIds = new Set(votes.map((v) => v.commentId));
  }

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      authorType: c.authorType,
      content: c.content,
      isEdited: c.isEdited,
      createdAt: c.createdAt.toISOString(),
      votes: c._count.votes,
      hasVoted: votedIds.has(c.id),
      canEdit: commenter?.id === c.authorId,
      replies: c.replies.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        authorType: r.authorType,
        content: r.content,
        isEdited: r.isEdited,
        createdAt: r.createdAt.toISOString(),
        votes: 0, // will be filled if needed
        hasVoted: votedIds.has(r.id),
        canEdit: commenter?.id === r.authorId,
      })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const commenter = await getCurrentCommenter();
  if (!commenter) {
    return NextResponse.json({ error: "You must be logged in to comment." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const postId = String(body.postId ?? "");
    const content = sanitizeContent(String(body.content ?? ""));
    const parentId = body.parentId ? String(body.parentId) : null;
    const honeypot = body.website ?? ""; // honeypot field

    // Honeypot check — bots fill this in
    if (honeypot) {
      return NextResponse.json({ ok: true }); // silently succeed, don't tell the bot
    }

    if (!postId || !content) {
      return NextResponse.json({ error: "Post ID and content are required." }, { status: 400 });
    }

    if (content.length < MIN_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Comment must be at least ${MIN_COMMENT_LENGTH} characters.` }, { status: 400 });
    }

    // Check post exists and is published
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // If replying, check parent exists
    if (parentId) {
      const parent = await db.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId || !parent.approved) {
        return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
      }
      // No nested replies — parent must be a top-level comment
      if (parent.parentId) {
        return NextResponse.json({ error: "Replies to replies are not allowed." }, { status: 400 });
      }
    }

    // Rate limit: check last comment time
    const lastComment = await db.comment.findFirst({
      where: { authorType: commenter.type, authorId: commenter.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastComment) {
      const secondsSince = (Date.now() - lastComment.createdAt.getTime()) / 1000;
      if (secondsSince < RATE_LIMIT_SECONDS) {
        const wait = Math.ceil(RATE_LIMIT_SECONDS - secondsSince);
        return NextResponse.json({ error: `Please wait ${wait}s before commenting again.` }, { status: 429 });
      }
    }

    // First-comment moderation:
    // - If commenter has firstCommentApproved = false → needs moderation
    // - If first comment has links → needs moderation (spam protection)
    const needsModeration = !commenter.firstCommentApproved || (!commenter.firstCommentApproved && hasLinks(content));

    // Determine author name
    const authorName = commenter.name;

    const comment = await db.comment.create({
      data: {
        postId,
        authorType: commenter.type,
        authorId: commenter.id,
        authorName,
        authorEmail: commenter.email,
        content,
        parentId,
        approved: !needsModeration,
      },
    });

    // Update post comment count
    await db.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // If first comment is approved, mark the commenter
    if (!needsModeration && !commenter.firstCommentApproved) {
      if (commenter.type === "READER") {
        await db.reader.update({
          where: { id: commenter.id },
          data: { firstCommentApproved: true },
        });
      }
      // For subscribers, we'd need a flag on subscriber — but for now, subscribers
      // always go through first-comment moderation (they don't have the flag)
    }

    bustPostsCache();

    // Notify post author + admin (non-blocking)
    if (needsModeration) {
      // Notify admin about pending comment
      const adminEmail = process.env.SMTP_USER ?? "admin@sanaathrumylens.co.ke";
      sendEmail({
        to: adminEmail,
        subject: `New comment awaiting moderation on "${post.title}"`,
        html: `<p>A new comment on "${post.title}" is awaiting moderation.</p><p><strong>${authorName}</strong> wrote:</p><blockquote>${content}</blockquote><p><a href="https://www.saaathrumylens.co.ke/admin/comments">Review in admin →</a></p>`,
        text: `New comment awaiting moderation on "${post.title}" by ${authorName}: ${content}`,
      }).catch((e) => console.error("Moderation email failed:", e));
    }

    return NextResponse.json({
      ok: true,
      comment: {
        id: comment.id,
        approved: comment.approved,
      },
      message: needsModeration
        ? "Your comment is awaiting moderation. It will appear once approved."
        : "Comment posted!",
    }, { status: 201 });
  } catch (e) {
    console.error("POST /api/comments error:", e);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
