import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { VerifyTokenForm } from "./VerifyTokenForm";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = { title: "Verifying your login link" };

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const token = sp.token ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="font-serif text-2xl font-bold">Verifying your login link</h1>
            <VerifyTokenForm token={token} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
