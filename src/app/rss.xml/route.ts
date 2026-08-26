import { db } from "@/lib/db";

export const dynamic = "force-static";
export const revalidate = 3600;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = "https://www.saaathrumylens.co.ke";

  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${baseUrl}/post/${p.slug}</link>
      <guid isPermaLink="true">${baseUrl}/post/${p.slug}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      ${p.category ? `<category>${escapeXml(p.category)}</category>` : ""}
      <author>${escapeXml(p.author)}</author>
      <pubDate>${p.createdAt.toUTCString()}</pubDate>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sanaa Thrumylens — Art Through My Lens</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>A Kenyan creative-arts blog covering music, literature, culture and the people shaping East Africa's creative economy.</description>
    <language>en-KE</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
