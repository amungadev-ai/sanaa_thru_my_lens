import { redirect } from "next/navigation";
import Image from "next/image";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const runtime = "nodejs";

export const metadata = {
  title: "Admin Login",
};

export default async function CmsLoginPage() {
  // Already authenticated? Go to dashboard.
  const authed = await isAuthenticated();
  if (authed) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Image src="/icons/icon.png" alt="Sanaa Thrumylens" width={48} height={48} className="rounded-md mx-auto" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-sidebar-foreground">
            Sanaa Thrumylens
          </h1>
          <p className="mt-1 text-sm text-sidebar-foreground/60">Admin sign in</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
