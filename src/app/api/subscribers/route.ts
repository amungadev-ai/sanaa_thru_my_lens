import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "ACTIVE";
  const q = searchParams.get("q")?.trim() ?? "";

  const subscribers = await db.subscriber.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(q ? { email: { contains: q } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ subscribers });
}
