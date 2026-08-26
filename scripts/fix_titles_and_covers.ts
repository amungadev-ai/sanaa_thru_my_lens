/**
 * Fix the "EP Review:" title to its full form, plus generate SVG cover
 * images for every published post (gradient + title text).
 */
import { db } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

const COVER_DIR = path.join(__dirname, "..", "public", "images", "covers");

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  "Music Reviews": ["#be123c", "#7f1d1d"],
  "Literature": ["#d97706", "#92400e"],
  "Culture & Opinion": ["#059669", "#064e3b"],
  "Scene Reports": ["#7c3aed", "#4c1d95"],
  "Features": ["#57534e", "#292524"],
};

const FALLBACK_GRADIENT: [string, string] = ["#44403c", "#1c1917"];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + " " + w).length <= maxCharsPerLine) {
      current += " " + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4); // max 4 lines
}

function generateCoverSvg(opts: {
  title: string;
  category: string;
  slug: string;
  author: string;
}): string {
  const [c1, c2] = CATEGORY_GRADIENTS[opts.category] ?? FALLBACK_GRADIENT;
  const W = 1200;
  const H = 800;
  const lines = wrapText(opts.title, 28);
  const startY = 380 - (lines.length - 1) * 30;
  const tspans = lines
    .map((line, i) => {
      const y = startY + i * 60;
      return `<tspan x="80" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="white" fill-opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <!-- Brand mark -->
  <g transform="translate(80, 80)">
    <rect width="48" height="48" rx="8" fill="white" fill-opacity="0.15"/>
    <text x="24" y="32" font-family="Georgia, serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">ST</text>
  </g>
  <text x="148" y="112" font-family="Georgia, serif" font-size="20" fill="white" fill-opacity="0.85">Sanaa Thrumylens</text>
  <!-- Category pill -->
  <g transform="translate(80, ${startY - 70})">
    <rect width="${opts.category.length * 11 + 32}" height="32" rx="16" fill="white" fill-opacity="0.18"/>
    <text x="16" y="21" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="white" letter-spacing="1.5">${escapeXml(opts.category.toUpperCase())}</text>
  </g>
  <!-- Title -->
  <text font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700" fill="white">
    ${tspans}
  </text>
  <!-- Author / divider -->
  <line x1="80" y1="${H - 130}" x2="180" y2="${H - 130}" stroke="white" stroke-width="2" stroke-opacity="0.6"/>
  <text x="80" y="${H - 90}" font-family="Inter, system-ui, sans-serif" font-size="16" fill="white" fill-opacity="0.9">By ${escapeXml(opts.author)}</text>
  <text x="80" y="${H - 60}" font-family="Inter, system-ui, sans-serif" font-size="13" fill="white" fill-opacity="0.6">sanaathrumylens.co.ke</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(COVER_DIR, { recursive: true });

  // 1) Fix EP Review title
  const epReview = await db.post.findFirst({
    where: { slug: "ep-review" },
  });
  if (epReview) {
    await db.post.update({
      where: { id: epReview.id },
      data: {
        title: "EP Review: The Lick Back by Nikita Kering",
        slug: "ep-review-the-lick-back-by-nikita-kering",
        excerpt:
          "Nikita Kering's 'The Lick Back' EP is a long-form project that proves she is in her flow state — a confident, polished statement from an artist stepping fully into her own.",
      },
    });
    console.log("✓ Fixed EP Review title and slug");
  }

  // 2) Regenerate all cover SVGs based on current post data
  const posts = await db.post.findMany();
  for (const p of posts) {
    const svg = generateCoverSvg({
      title: p.title,
      category: p.category ?? "Features",
      slug: p.slug,
      author: p.author,
    });
    const filePath = path.join(COVER_DIR, `${p.slug}.svg`);
    fs.writeFileSync(filePath, svg, "utf-8");
    // Update coverImage to point to the generated SVG
    if (p.coverImage !== `/images/covers/${p.slug}.svg`) {
      await db.post.update({
        where: { id: p.id },
        data: { coverImage: `/images/covers/${p.slug}.svg` },
      });
    }
    console.log(`  ✓ cover: ${p.slug}.svg`);
  }

  console.log(`\n✅ Generated ${posts.length} cover images in ${COVER_DIR}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
