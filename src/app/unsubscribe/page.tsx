import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { UnsubscribeForm } from "./UnsubscribeForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const email = sp.email?.trim() ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="font-serif text-2xl font-bold">Unsubscribe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re sorry to see you go. Confirm your email below to stop receiving
              The Weekly Dispatch from Sanaa Thrumylens.
            </p>
            <UnsubscribeForm initialEmail={email} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
