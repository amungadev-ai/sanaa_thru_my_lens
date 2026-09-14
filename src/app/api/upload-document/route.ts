import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentEditor } from "@/lib/editor-auth";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Estimate reading time from word count
 */
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Parse a .docx file using docx-parser (pure Node.js, no DOMMatrix needed).
 * Returns plain text which we convert to HTML.
 */
async function parseDocx(filePath: string): Promise<{ text: string; html: string }> {
  const docxParser = (await import("docx-parser")).default;
  return new Promise((resolve, reject) => {
    docxParser.parseDocx(filePath, (text: string) => {
      if (!text || text.trim().length === 0) {
        reject(new Error("No text extracted from .docx file."));
        return;
      }
      const html = textToHtml(text);
      resolve({ text, html });
    });
  });
}

/**
 * Parse a .pdf file using unpdf (serverless-friendly, no DOMMatrix needed).
 */
async function parsePdf(filePath: string): Promise<{ text: string; html: string }> {
  const { extractText } = await import("unpdf");
  const dataBuffer = fs.readFileSync(filePath);
  const { text } = await extractText(dataBuffer, { mergePages: true });

  if (!text || text.trim().length === 0) {
    throw new Error("No text extracted from PDF. It may be a scanned document.");
  }
  const html = textToHtml(text);
  return { text, html };
}

/**
 * Convert plain text to HTML with basic heading detection.
 * Strategy:
 * - First non-empty line → title (wrapped in <h2>)
 * - Lines that are short, start with uppercase, no period → <h2>
 * - Other lines → <p> paragraphs
 */
function textToHtml(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const htmlParts: string[] = [];
  let isFirstLine = true;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const para = currentParagraph.join(" ").trim();
      if (para) {
        htmlParts.push(`<p>${escapeHtml(para)}</p>`);
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    // First non-empty line is the title
    if (isFirstLine) {
      htmlParts.push(`<h2>${escapeHtml(line)}</h2>`);
      isFirstLine = false;
      continue;
    }

    // Check if this looks like a heading:
    // - Short (< 80 chars)
    // - Doesn't end with period/question/exclamation (unless it's very short)
    // - Few words (1-6)
    const words = line.split(/\s+/);
    const isHeading =
      line.length < 80 &&
      words.length <= 6 &&
      !/[.!?]$/.test(line) &&
      /^[A-Z]/.test(line);

    if (isHeading) {
      flushParagraph();
      htmlParts.push(`<h2>${escapeHtml(line)}</h2>`);
    } else {
      currentParagraph.push(line);
    }
  }
  flushParagraph();

  return htmlParts.join("\n");
}

/**
 * Extract a title from the text — first line
 */
function extractTitle(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    return lines[0].slice(0, 255);
  }
  return "Untitled Document";
}

/**
 * Generate an excerpt from the second paragraph (skipping the title line)
 */
function generateExcerpt(text: string, title: string, maxLen = 180): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line === title) continue; // skip title line
    if (line.length < 40) continue; // skip short lines
    // First real body paragraph
    if (line.length <= maxLen) return line;
    const cut = line.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace > 60 ? lastSpace : maxLen).trim() + "…";
  }
  return "";
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
        { error: 'No file provided. Use field name "file".' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 413 }
      );
    }

    const filename = file.name.toLowerCase();
    const ext = path.extname(filename);

    // Save the file to a temp location
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
    fs.writeFileSync(tempFile, buffer);

    try {
      let text = "";
      let html = "";

      if (ext === ".docx") {
        const result = await parseDocx(tempFile);
        text = result.text;
        html = result.html;
      } else if (ext === ".pdf") {
        const result = await parsePdf(tempFile);
        text = result.text;
        html = result.html;
      } else if (ext === ".txt" || ext === ".md") {
        text = buffer.toString("utf-8");
        html = textToHtml(text);
      } else if (ext === ".doc") {
        return NextResponse.json(
          { error: "Legacy .doc format is not supported. Please save as .docx or .pdf." },
          { status: 415 }
        );
      } else {
        return NextResponse.json(
          { error: `Unsupported file type (.${ext}). Supported: .docx, .pdf, .txt` },
          { status: 415 }
        );
      }

      if (!html || html.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract any content from the document. It may be empty or scanned." },
          { status: 422 }
        );
      }

      const title = extractTitle(text);
      const excerpt = generateExcerpt(text, title);
      const readingTime = estimateReadingTime(text);
      const slug = slugify(title);
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return NextResponse.json({
        ok: true,
        title,
        slug,
        excerpt,
        content: html,
        readingTime,
        wordCount,
      });
    } finally {
      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
    }
  } catch (e) {
    console.error("Document upload error:", e);
    const message = e instanceof Error ? e.message : "Failed to parse document.";
    return NextResponse.json(
      { error: `Document parsing failed: ${message}` },
      { status: 500 }
    );
  }
}
