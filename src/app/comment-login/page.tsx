import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { CommentAuthForm } from "./CommentAuthForm";

export const metadata = { title: "Log in to comment" };

export const dynamic = "force-dynamic";

export default function CommentLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="font-serif text-2xl font-bold">Join the conversation</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log in to comment on stories. We&apos;ll send a magic link to your email —
              no password needed.
            </p>
            <CommentAuthForm mode="login" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
