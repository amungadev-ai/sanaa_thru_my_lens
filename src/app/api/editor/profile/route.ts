import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentEditor } from "@/lib/editor-auth";

/** PUT — update the current editor's profile (name, bio, avatar) */
export async function PUT(req: NextRequest) {
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim() || null;
    const bio = String(body.bio ?? "").trim() || null;
    const avatar = String(body.avatar ?? "").trim() || null;

    const updated = await db.editor.update({
      where: { id: editor.id },
      data: { name, bio, avatar },
    });

    // If the editor has a display name, update it on all their posts
    if (name && name !== editor.name) {
      await db.post.updateMany({
        where: { authorId: editor.id },
        data: { author: name },
      });
    }

    return NextResponse.json({
      ok: true,
      editor: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        bio: updated.bio,
        avatar: updated.avatar,
      },
    });
  } catch (e) {
    console.error("PUT /api/editor/profile error:", e);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
