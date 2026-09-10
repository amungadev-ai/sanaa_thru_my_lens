import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentEditor } from "@/lib/editor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Polyfill DOMMatrix for mammoth.js on Node.js/Vercel serverless.
 * mammoth uses DOMMatrix internally for some operations, but it doesn't
 * exist in the Node.js global scope. This simple polyfill provides enough
 * for mammoth to work.
 */
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-ignore
  globalThis.DOMMatrix = class DOMMatrix {
    private values: number[];
    constructor(init?: string | number[]) {
      if (typeof init === "string") {
        // Parse matrix() string — not fully implemented, just enough for mammoth
        const nums = init.match(/-?[\d.]+/g)?.map(Number) ?? [];
        this.values = nums.length >= 6 ? nums : [1, 0, 0, 1, 0, 0];
      } else if (Array.isArray(init)) {
        this.values = init.length >= 6 ? init : [1, 0, 0, 1, 0, 0];
      } else {
        this.values = [1, 0, 0, 1, 0, 0]; // identity
      }
    }
    get a() { return this.values[0] ?? 1; }
    get b() { return this.values[1] ?? 0; }
    get c() { return this.values[2] ?? 0; }
    get d() { return this.values[3] ?? 1; }
    get e() { return this.values[4] ?? 0; }
    get f() { return this.values[5] ?? 0; }
    isIdentity() { return this.values[0] === 1 && this.values[3] === 1 && this.values[1] === 0 && this.values[2] === 0 && this.values[4] === 0 && this.values[5] === 0; }
  };
}

/**
 * Estimate reading time from word count
 */
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Generate an excerpt from the first body paragraph (skipping headings and titles)
 */
function generateExcerpt(html: string, title: string, maxLen = 180): string {
  const paragraphs = html.match(/<p>(.*?)<\/p>/gi) ?? [];
  for (const p of paragraphs) {
    const text = p.replace(/<[^>]+>/g, "").trim();
    if (!text || text.length < 40) continue;
    // Skip if this paragraph IS the title
    if (title && text === title) continue;
    // First real paragraph
    if (text.length <= maxLen) return text;
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace > 60 ? lastSpace : maxLen).trim() + "…";
  }
  return "";
}

/**
 * Extract a title from the document — first heading or first short paragraph
 */
function extractTitle(html: string, text: string): string {
  // Try first <h1>, <h2>, or <h3>
  const headingMatch = html.match(/<h[123][^>]*>(.*?)<\/h[123]>/i);
  if (headingMatch) {
    return headingMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 255);
  }

  // No heading found — try to extract a title from the first paragraph
  // Strategy: the first <p> that is short (< 200 chars) and looks like a title
  // (no period at the end, doesn't start with lowercase)
  const paragraphs = html.match(/<p>(.*?)<\/p>/gi) ?? [];
  for (const p of paragraphs) {
    const pText = p.replace(/<[^>]+>/g, "").trim();
    if (pText.length === 0) continue;
    // Skip if it looks like a body paragraph (long, ends with period)
    if (pText.length > 150) continue;
    if (/[.!?]$/.test(pText) && pText.split(/\s+/).length > 8) continue;
    // This looks like a title
    return pText.slice(0, 255);
  }

  // Fall back to first non-empty line of text (truncated to 120 chars)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    return lines[0].slice(0, 120);
  }
  return "Untitled Document";
}

/**
 * Convert plain text (from PDF) to basic HTML
 */
function textToHtml(text: string): string {
  const lines = text.split("\n");
  const htmlParts: string[] = [];
  let inParagraph = false;
  let isFirstLine = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph) {
        htmlParts.push("</p>");
        inParagraph = false;
      }
      continue;
    }

    // First non-empty line might be a title
    if (isFirstLine && trimmed.length < 200 && !trimmed.endsWith(".")) {
      htmlParts.push(`<h2>${escapeHtml(trimmed)}</h2>`);
      isFirstLine = false;
      continue;
    }

    // Lines that look like headings (short, no period, title case)
    if (trimmed.length < 80 && !/[.!?]$/.test(trimmed) && !trimmed.startsWith("-")) {
      // Count words — if 1-6 words, treat as heading
      const words = trimmed.split(/\s+/);
      if (words.length <= 6 && /^[A-Z]/.test(trimmed)) {
        if (inParagraph) {
          htmlParts.push("</p>");
          inParagraph = false;
        }
        htmlParts.push(`<h2>${escapeHtml(trimmed)}</h2>`);
        continue;
      }
    }

    // Regular paragraph
    if (!inParagraph) {
      htmlParts.push("<p>");
      inParagraph = true;
    } else {
      htmlParts.push(" ");
    }
    htmlParts.push(escapeHtml(trimmed));
  }

  if (inParagraph) {
    htmlParts.push("</p>");
  }

  return htmlParts.join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  // Auth: admin OR editor
  const isAdmin = await isAuthenticated();
  if (!isAdmin) {
    const editor = await getCurrentEditor();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use field name \"file\"." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 20MB.` },
        { status: 413 }
      );
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let html = "";
    let plainText = "";

    if (filename.endsWith(".docx")) {
      // Parse DOCX with mammoth
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ buffer });
      html = result.value;
      plainText = html.replace(/<[^>]+>/g, " ");
    } else if (filename.endsWith(".pdf")) {
      // Parse PDF with pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      plainText = data.text;
      html = textToHtml(plainText);
    } else if (filename.endsWith(".doc")) {
      return NextResponse.json(
        {
          error: "Legacy .doc format is not supported. Please save as .docx or .pdf.",
        },
        { status: 415 }
      );
    } else if (filename.endsWith(".txt")) {
      plainText = buffer.toString("utf-8");
      html = textToHtml(plainText);
    } else {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload a .docx, .pdf, or .txt file.",
        },
        { status: 415 }
      );
    }

    // Clean up the HTML — remove empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, "").trim();

    if (!html) {
      return NextResponse.json(
        { error: "Could not extract any content from the document. It may be empty or scanned." },
        { status: 422 }
      );
    }

    const title = extractTitle(html, plainText);
    const excerpt = generateExcerpt(html, title);
    const readingTime = estimateReadingTime(plainText);
    const slug = slugify(title);

    return NextResponse.json({
      ok: true,
      title,
      slug,
      excerpt,
      content: html,
      readingTime,
      wordCount: plainText.split(/\s+/).filter(Boolean).length,
    });
  } catch (e) {
    console.error("Document upload error:", e);
    const message = e instanceof Error ? e.message : "Failed to parse document.";
    return NextResponse.json(
      { error: `Document parsing failed: ${message}` },
      { status: 500 }
    );
  }
}
