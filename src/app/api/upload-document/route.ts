import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentEditor } from "@/lib/editor-auth";
import { execFile } from "child_process";
import { promisify } from "util";
import { marked } from "marked";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Run markitdown (Python CLI) on a file and return Markdown.
 */
async function runMarkitdown(filePath: string): Promise<string> {
  const markitdownPath = "/home/z/.local/bin/markitdown";
  try {
    const { stdout } = await execFileAsync(markitdownPath, [filePath], {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PATH: "/home/z/.local/bin:" + process.env.PATH },
    });
    return stdout;
  } catch (e) {
    throw new Error(`markitdown failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Convert Markdown to clean HTML using marked.
 * Configured to produce semantic HTML (h2 for ## headings, p for paragraphs, etc.)
 */
function markdownToHtml(markdown: string): string {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  const html = marked.parse(markdown) as string;
  // Clean up — remove empty paragraphs
  return html.replace(/<p>\s*<\/p>/g, "").trim();
}

/**
 * Extract a title from the Markdown — first # heading or first line
 */
function extractTitle(markdown: string): string {
  // Try first # heading
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      return trimmed.replace(/^#\s+/, "").trim().slice(0, 255);
    }
  }
  // Try first **bold** line (markitdown puts titles as **Title**)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch && boldMatch[1].length < 200) {
      return boldMatch[1].trim();
    }
  }
  // Fall back to first non-empty line (truncated)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("---")) {
      return trimmed.replace(/[*_#`]/g, "").trim().slice(0, 120);
    }
  }
  return "Untitled Document";
}

/**
 * Generate an excerpt from the first paragraph of the Markdown.
 */
function generateExcerpt(markdown: string, title: string, maxLen = 180): string {
  const lines = markdown.split("\n").map((l) => l.trim());
  for (const line of lines) {
    if (!line || line.startsWith("#") || line.startsWith("**") || line.startsWith("---")) continue;
    // Skip the title if it appears as plain text
    if (title && line.replace(/[*_#`]/g, "").trim() === title) continue;
    // First real paragraph
    const clean = line.replace(/[*_#`]/g, "").trim();
    if (clean.length < 40) continue;
    if (clean.length <= maxLen) return clean;
    const cut = clean.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace > 60 ? lastSpace : maxLen).trim() + "…";
  }
  return "";
}

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

    // Supported extensions
    const supported = [".docx", ".pdf", ".txt", ".md", ".doc", ".pptx", ".xlsx", ".html", ".csv"];
    if (!supported.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type (.${ext}). Supported: ${supported.join(", ")}` },
        { status: 415 }
      );
    }

    // Save the file to a temp location (markitdown needs a file path)
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
    fs.writeFileSync(tempFile, buffer);

    try {
      // Run markitdown
      const markdown = await runMarkitdown(tempFile);

      if (!markdown || markdown.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract any content from the document. It may be empty or scanned." },
          { status: 422 }
        );
      }

      // Convert Markdown to HTML
      const html = markdownToHtml(markdown);

      // Extract title, excerpt, etc.
      const title = extractTitle(markdown);
      const excerpt = generateExcerpt(markdown, title);
      const plainText = markdown.replace(/[*_#`>]/g, "").trim();
      const readingTime = estimateReadingTime(plainText);
      const slug = slugify(title);
      const wordCount = plainText.split(/\s+/).filter(Boolean).length;

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
