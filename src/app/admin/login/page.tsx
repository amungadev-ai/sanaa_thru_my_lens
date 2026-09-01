import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Editor Login",
};

export default async function CmsLoginPage() {
  // Already authenticated? Go to dashboard.
  const authed = await isAuthenticated();
  if (authed) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-serif text-xl font-bold">ST</span>
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-sidebar-foreground">
            Sanaa Thrumylens
          </h1>
          <p className="mt-1 text-sm text-sidebar-foreground/60">Editor sign in</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
