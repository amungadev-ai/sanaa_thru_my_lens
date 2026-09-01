import { redirect } from "next/navigation";
import { isAuthenticated, logout } from "@/lib/auth";
import { CmsShell } from "@/components/cms/CmsShell";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  return <CmsShell>{children}</CmsShell>;
}
