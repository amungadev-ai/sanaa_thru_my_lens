import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentEditor } from "@/lib/editor-auth";
import { EditorLoginForm } from "./EditorLoginForm";

export const runtime = "nodejs";

export const metadata = {
  title: "Editor Login",
};

export const dynamic = "force-dynamic";

export default async function EditorLoginPage() {
  const editor = await getCurrentEditor();
  if (editor) redirect("/editor");

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Image src="/icons/icon.png" alt="Sanaa Thrumylens" width={48} height={48} className="rounded-md mx-auto" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-sidebar-foreground">
            Editor Sign In
          </h1>
          <p className="mt-1 text-sm text-sidebar-foreground/60">Sanaa Thrumylens editorial team</p>
        </div>
        <EditorLoginForm />
      </div>
    </div>
  );
}
