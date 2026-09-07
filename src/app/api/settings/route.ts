import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { isAuthenticated } from "@/lib/auth";

import { bustSettingsCache } from "@/lib/cache-bust";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = {
      siteName: String(body.siteName ?? "Sanaa Thrumylens"),
      tagline: String(body.tagline ?? ""),
      description: String(body.description ?? ""),
      logoText: String(body.logoText ?? "ST").slice(0, 3),
      socialInstagram: String(body.socialInstagram ?? "") || null,
      socialTwitter: String(body.socialTwitter ?? "") || null,
      socialFacebook: String(body.socialFacebook ?? "") || null,
      socialEmail: String(body.socialEmail ?? "") || null,
    };

    await db.siteSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    // Bust the cache so updated settings appear immediately
    bustSettingsCache();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/settings error:", e);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
