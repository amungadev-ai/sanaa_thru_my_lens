import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentEditor } from "@/lib/editor-auth";
import { db, withRetry } from "@/lib/db";


const CDN_URL = process.env.CDN_URL ?? "https://cdn.sanaathrumylens.co.ke";
const CDN_API_KEY = process.env.CDN_API_KEY ?? "";

/**
 * GET /api/media — list all images on the CDN.
 * Available to both admin and editors (editors can browse).
 *
 * Query params: page, per_page, q (search by filename)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth: admin OR editor
  const isAdmin = await isAuthenticated();
  if (!isAdmin) {
    const editor = await getCurrentEditor();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!CDN_API_KEY || CDN_API_KEY.includes("change_me")) {
    return NextResponse.json({ error: "CDN not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "50";
  const q = searchParams.get("q") ?? "";

  try {
    const cdnUrl = `${CDN_URL}/upload.php?list=true&page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
    const res = await fetch(cdnUrl, {
      headers: {
        Authorization: `Bearer ${CDN_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "CDN returned an unexpected response." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "CDN list failed." },
        { status: res.status }
      );
    }

    // For each image, check if it's used in any post
    // (usage tracking — scan post coverImage + content for the URL)
    if (data.images && Array.isArray(data.images)) {
      const imagesWithUsage = await Promise.all(
        data.images.map(async (img: { url: string; path: string }) => {
          try {
            // Search posts where coverImage matches OR content contains the URL
            const [coverMatch, contentMatch] = await Promise.all([
              withRetry(() =>
                db.post.count({
                  where: { coverImage: { contains: img.url } },
                })
              ),
              withRetry(() =>
                db.post.count({
                  where: { content: { contains: img.url } },
                })
              ),
            ]);
            const usedInCount = coverMatch + contentMatch;
            return { ...img, usedIn: usedInCount };
          } catch {
            // If DB query fails, return 0 usage
            return { ...img, usedIn: 0 };
          }
        })
      );
      data.images = imagesWithUsage;
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Media list error:", e);
    return NextResponse.json({ error: "Failed to reach CDN." }, { status: 502 });
  }
}

/**
 * POST /api/media — upload a new image to the CDN.
 * Available to both admin and editors.
 */
export async function POST(req: NextRequest) {
  // Auth: admin OR editor
  const isAdmin = await isAuthenticated();
  if (!isAdmin) {
    const editor = await getCurrentEditor();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!CDN_API_KEY || CDN_API_KEY.includes("change_me")) {
    return NextResponse.json({ error: "CDN not configured." }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use field name "file".' },
        { status: 400 }
      );
    }

    const cdnForm = new FormData();
    cdnForm.append("file", file, file.name);

    const res = await fetch(`${CDN_URL}/upload.php`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CDN_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      body: cdnForm,
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "CDN returned an unexpected response." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: result.error ?? "CDN upload failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("Media upload error:", e);
    return NextResponse.json({ error: "Failed to reach CDN." }, { status: 502 });
  }
}

/**
 * DELETE /api/media?path=YYYY/MM/file.jpg — delete an image from the CDN.
 * ADMIN ONLY — editors cannot delete.
 */
export async function DELETE(req: NextRequest) {
  const isAdmin = await isAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admins can delete media." }, { status: 403 });
  }

  if (!CDN_API_KEY || CDN_API_KEY.includes("change_me")) {
    return NextResponse.json({ error: "CDN not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path is required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${CDN_URL}/upload.php?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${CDN_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "CDN returned an unexpected response." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: result.error ?? "CDN delete failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Media delete error:", e);
    return NextResponse.json({ error: "Failed to reach CDN." }, { status: 502 });
  }
}
