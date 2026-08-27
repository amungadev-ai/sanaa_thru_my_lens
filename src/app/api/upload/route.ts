import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Upload endpoint (auth required).
 *
 * Two modes:
 *
 * 1. SVG auto-generation (local):
 *    Body: { type: "svg", filename, content }
 *    Saves an SVG string to /public/images/covers/ on the blog server.
 *
 * 2. Image upload to CDN:
 *    Body: multipart/form-data with field "file" (the image)
 *    Proxies the file to cdn.sanaathrumylens.co.ke/upload.php
 *    Returns { ok: true, url: "https://cdn.sanaathrumylens.co.ke/images/..." }
 */

// Force dynamic to avoid static optimization issues
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // --- Image upload (multipart) → proxy to CDN ---------------------------
  if (contentType.includes("multipart/form-data")) {
    return proxyToCdn(req);
  }

  // --- SVG auto-generation (JSON) → save locally -------------------------
  try {
    const body = await req.json();
    const type = String(body.type ?? "svg");
    const filename = String(body.filename ?? "").trim();
    const content = String(body.content ?? "");

    if (!filename || !content) {
      return NextResponse.json(
        { error: "filename and content are required." },
        { status: 400 }
      );
    }

    if (type !== "svg") {
      return NextResponse.json(
        { error: "Only SVG uploads are supported locally. Use the CDN for images." },
        { status: 400 }
      );
    }

    // Sanitize filename
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    if (!safe.endsWith(".svg")) {
      return NextResponse.json(
        { error: "Filename must end with .svg" },
        { status: 400 }
      );
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

/**
 * Proxy a multipart file upload to the CDN's upload.php endpoint.
 * Forwards the Bearer API key from the CDN_API_KEY env var.
 */
async function proxyToCdn(req: NextRequest): Promise<NextResponse> {
  const cdnUrl = process.env.CDN_URL;
  const cdnApiKey = process.env.CDN_API_KEY;

  if (!cdnUrl || !cdnApiKey || cdnApiKey.includes("change_me")) {
    return NextResponse.json(
      {
        error:
          "CDN not configured. Set CDN_URL and CDN_API_KEY in .env (see cdn-files/README.md).",
      },
      { status: 503 }
    );
  }

  try {
    // Read the multipart body and forward it to the CDN
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use field name "file".' },
        { status: 400 }
      );
    }

    // Build a new FormData to send to the CDN
    const cdnForm = new FormData();
    cdnForm.append("file", file, file.name);

    const cdnResponse = await fetch(`${cdnUrl}/upload.php`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cdnApiKey}`,
        // LiteSpeed bot protection blocks requests with non-browser User-Agents.
        // Use a browser-like UA to avoid the bot verification page.
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      body: cdnForm,
    });

    // Get the response as text first, then try to parse as JSON
    const responseText = await cdnResponse.text();
    let cdnResult;
    try {
      cdnResult = JSON.parse(responseText);
    } catch {
      console.error("CDN returned non-JSON response:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "CDN returned an unexpected response. Check upload.php configuration." },
        { status: 502 }
      );
    }

    if (!cdnResponse.ok) {
      return NextResponse.json(
        { error: cdnResult.error ?? "CDN upload failed." },
        { status: cdnResponse.status }
      );
    }

    // Return the CDN response to the client
    return NextResponse.json(cdnResult, { status: 201 });
  } catch (e) {
    console.error("CDN proxy error:", e);
    return NextResponse.json(
      { error: "Failed to reach CDN. Check your network and CDN_URL setting." },
      { status: 502 }
    );
  }
}
