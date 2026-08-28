import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { validateInviteToken } from "@/lib/editor-auth";
import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { SetupPasswordForm } from "./SetupPasswordForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditorInvitePage({ params }: PageProps) {
  const { token } = await params;
  const editor = await validateInviteToken(token);

  if (!editor) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-2xl font-bold">Invite link invalid or expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This invite link may have expired (they last 7 days) or may have already been used.
              Please ask the admin to send you a new invite.
            </p>
            <a
              href="mailto:hello@sanaathrumylens.co.ke"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Contact us →
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Already active? Redirect to login
  if (editor.status === "ACTIVE" && editor.passwordHash) {
    redirect("/editor/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="font-serif text-2xl font-bold">Welcome to Sanaa Thrumylens</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ve been invited to join the editorial team. Set your password below to
              activate your account and start writing.
            </p>
            <SetupPasswordForm token={token} email={editor.email} name={editor.name} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
