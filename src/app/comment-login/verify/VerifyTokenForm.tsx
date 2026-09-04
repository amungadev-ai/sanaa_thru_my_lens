"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function VerifyTokenForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "No token provided. Check your email link."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/comment-auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          setStatus("success");
          setMessage(`Welcome, ${data.name}! You're logged in.`);
          toast.success("Logged in successfully");
          // Redirect back to the article (or home) after 2 seconds
          setTimeout(() => {
            const from = sessionStorage.getItem("comment_redirect") ?? "/";
            router.push(from);
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "This link is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    })();
  }, [token, router]);

  return (
    <div className="mt-6">
      {status === "loading" && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying your link…</span>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="font-serif text-lg font-bold text-emerald-700">Success!</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <p className="mt-2 text-xs text-muted-foreground">Redirecting you back…</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="font-serif text-lg font-bold">Verification failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/comment-login">Get a new link</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
