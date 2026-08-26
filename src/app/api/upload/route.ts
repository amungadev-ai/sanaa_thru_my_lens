import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Upload endpoint. Currently supports SVG cover images saved to
 * /public/images/covers/. Used by the PostEditor's "Auto-generate cover"
 * button. Auth required.
 */
export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const type = String(body.type ?? "svg");
    const filename = String(body.filename ?? "").trim();
    const content = String(body.content ?? "");

    if (!filename || !content) {
      return NextResponse.json({ error: "filename and content are required." }, { status: 400 });
    }

    // Only allow SVG for now
    if (type !== "svg") {
      return NextResponse.json({ error: "Only SVG uploads are supported in this build." }, { status: 400 });
    }

    // Sanitize filename
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    if (!safe.endsWith(".svg")) {
      return NextResponse.json({ error: "Filename must end with .svg" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "images", "covers");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, safe);
    fs.writeFileSync(filePath, content, "utf-8");

    const url = `/images/covers/${safe}`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("POST /api/upload error:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
