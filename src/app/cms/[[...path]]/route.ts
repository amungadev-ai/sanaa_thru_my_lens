import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * Redirect /cms/* → /admin/* for backwards compatibility.
 * Old bookmarks and links still work; new canonical paths use /admin.
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const rest = path?.length ? "/" + path.join("/") : "";
  redirect(`/admin${rest}`);
}
