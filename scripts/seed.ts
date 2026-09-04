/**
 * Seed script for Sanaa Thrumylens blog.
 * Reads extracted articles from scripts/articles_extracted.json,
 * converts them to HTML, and seeds the database.
 */
import { db } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

interface ExtractedParagraph {
  text: string;
  style: string;
}

interface ExtractedArticle {
  filename: string;
  title: string;
  paragraphs: ExtractedParagraph[];
  word_count: number;
}

const ARTICLES_JSON = path.join(__dirname, "articles_extracted.json");

// ---- Helpers ---------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isLikelyHeading(p: ExtractedParagraph): boolean {
  const t = p.text.trim();
  if (!t) return false;
  // Explicit heading style
  if (/heading|title/i.test(p.style)) return true;
  // Short, no terminal punctuation, no commas
  if (t.length > 90) return false;
  if (/[.,;:!?]$/.test(t)) return false;
  // Skip if it looks like a sentence (contains lowercase verb patterns)
  if (/\b(the|a|an|and|or|but|because|when|while|if|that|which|who)\s+/i.test(t.toLowerCase()) && t.length > 30) {
    return false;
  }
  // Title-case-ish or short phrase
  const words = t.split(/\s+/);
  if (words.length <= 8) return true;
  return false;
}

function paragraphToHtml(p: ExtractedParagraph): string {
  const text = htmlEscape(p.text);
  if (isLikelyHeading(p)) {
    return `<h2>${text}</h2>`;
  }
  return `<p>${text}</p>`;
}

function buildExcerpt(paragraphs: ExtractedParagraph[], maxLen = 180): string {
  for (const p of paragraphs) {
    if (isLikelyHeading(p)) continue;
    const t = p.text.trim();
    if (t.length < 40) continue;
    if (t.length <= maxLen) return t;
    // Cut at word boundary
    const cut = t.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace > 60 ? lastSpace : maxLen).trim() + "…";
  }
  // Fallback
  return paragraphs[0]?.text.slice(0, maxLen) ?? "";
}

function readingTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

// Cover image: use a generated gradient placeholder via picsum or local asset.
// We'll use deterministic gradients served from /images/covers/<slug>.svg later.
function coverImageFor(category: string, slug: string): string {
  return `/images/covers/${slug}.svg`;
}

// ---- Category assignment ---------------------------------------------------

interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  color: string; // tailwind gradient stops
}

function categorize(filename: string, title: string): CategoryInfo {
  const lower = (filename + " " + title).toLowerCase();
  if (lower.includes("literature") || lower.includes("literary") || lower.includes("litrature")) {
    return { name: "Literature", slug: "literature", description: "Book reviews, literary analysis, and the Kenyan writing scene.", color: "from-amber-500 to-orange-700" };
  }
  if (lower.includes("underdog") || lower.includes("creative and art") || lower.includes("opinion")) {
    return { name: "Culture & Opinion", slug: "culture-opinion", description: "Cultural commentary and opinions on Kenya's creative industry.", color: "from-emerald-600 to-teal-800" };
  }
  if (lower.includes("ep review") || lower.includes("lick back") || lower.includes("disco") || lower.includes("disko")) {
    return { name: "Music Reviews", slug: "music-reviews", description: "Album, EP, and music video reviews from the Kenyan scene.", color: "from-rose-600 to-red-800" };
  }
  if (lower.includes("the bag") || lower.includes("dj")) {
    return { name: "Scene Reports", slug: "scene-reports", description: "On-the-ground coverage of Kenyan cultural events and happenings.", color: "from-violet-600 to-purple-800" };
  }
  return { name: "Features", slug: "features", description: "Long-form features on Kenyan art and creativity.", color: "from-stone-600 to-stone-800" };
}

// ---- Main seed routine -----------------------------------------------------

async function seedCategories() {
  console.log("→ Seeding categories");
  const categories: CategoryInfo[] = [
    { name: "Music Reviews", slug: "music-reviews", description: "Album, EP, and music video reviews from the Kenyan scene.", color: "from-rose-600 to-red-800" },
    { name: "Literature", slug: "literature", description: "Book reviews, literary analysis, and the Kenyan writing scene.", color: "from-amber-500 to-orange-700" },
    { name: "Culture & Opinion", slug: "culture-opinion", description: "Cultural commentary and opinions on Kenya's creative industry.", color: "from-emerald-600 to-teal-800" },
    { name: "Scene Reports", slug: "scene-reports", description: "On-the-ground coverage of Kenyan cultural events and happenings.", color: "from-violet-600 to-purple-800" },
    { name: "Features", slug: "features", description: "Long-form features on Kenyan art and creativity.", color: "from-stone-600 to-stone-800" },
  ];
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, color: c.color },
      create: c,
    });
    console.log(`  ✓ ${c.name}`);
  }
}

async function seedAdmin() {
  console.log("→ Seeding admin user");
  // Simple plaintext for dev (we'll hash on login compare). For demo only.
  const email = "admin@sanaathrumylens.co.ke";
  const password = "Admin254!"; // demo password
  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, password, name: "Sanaa Editor", role: "ADMIN" },
  });
  console.log(`  ✓ ${email} / ${password}`);
}

async function seedTestEditor() {
  console.log("→ Seeding test editor");
  const email = "editor@sanaathrumylens.co.ke";
  const password = "Editor254!";
  const { hashPassword } = await import("../src/lib/editor-auth");
  const passwordHash = await hashPassword(password);

  const existing = await db.editor.findUnique({ where: { email } });
  if (existing) {
    await db.editor.update({
      where: { id: existing.id },
      data: { name: "Test Editor", passwordHash, status: "ACTIVE", role: "EDITOR", inviteToken: null, inviteExpires: null },
    });
  } else {
    await db.editor.create({
      data: { email, name: "Test Editor", passwordHash, status: "ACTIVE", role: "EDITOR" },
    });
  }
  console.log(`  ✓ ${email} / ${password}`);
}

async function seedSiteSettings() {
  console.log("→ Seeding site settings");
  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Sanaa Thrumylens",
      tagline: "Art Through My Lens",
      description:
        "A Kenyan creative-arts blog covering music, literature, culture and the people shaping East Africa's creative economy.",
      logoText: "ST",
      socialInstagram: "@sanaathrumylens",
      socialTwitter: "@sanaathrumylens",
      socialEmail: "hello@sanaathrumylens.co.ke",
    },
  });
  console.log("  ✓ site settings");
}

async function seedPosts() {
  console.log("→ Seeding posts");
  const raw = fs.readFileSync(ARTICLES_JSON, "utf-8");
  const articles: ExtractedArticle[] = JSON.parse(raw);

  // Mark the first article as featured (the most editorial piece)
  const featuredSlugs = ["ujana-ni-moshi-ndio-maana-tunavutia-kodong-klan-s-disko-video"];

  for (const article of articles) {
    const category = categorize(article.filename, article.title);
    const slug = slugify(article.title) || slugify(article.filename.replace(/\.docx$/, ""));
    const content = article.paragraphs.map(paragraphToHtml).join("\n");
    const excerpt = buildExcerpt(article.paragraphs);
    const tags = [category.name, "Kenya", "Creative Arts"].join(",");
    const coverImage = coverImageFor(category.slug, slug);

    await db.post.upsert({
      where: { slug },
      update: {
        title: article.title,
        excerpt,
        content,
        category: category.name,
        tags,
        coverImage,
        readingTime: readingTime(article.word_count),
        featured: featuredSlugs.includes(slug),
        status: "PUBLISHED",
      },
      create: {
        title: article.title,
        slug,
        excerpt,
        content,
        category: category.name,
        tags,
        author: "Sanaa Thrumylens",
        coverImage,
        readingTime: readingTime(article.word_count),
        featured: featuredSlugs.includes(slug),
        status: "PUBLISHED",
        views: Math.floor(Math.random() * 800) + 100,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400_000),
      },
    });
    console.log(`  ✓ ${article.title}  [${category.name}, ${article.word_count} words]`);
  }
}

async function main() {
  console.log("Seeding Sanaa Thrumylens database…\n");
  await seedCategories();
  await seedAdmin();
  await seedTestEditor();
  await seedSiteSettings();
  await seedPosts();
  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
