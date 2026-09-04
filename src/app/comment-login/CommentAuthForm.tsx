"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from "lucide-react";

interface CommentAuthFormProps {
  mode: "login" | "register";
}

export function CommentAuthForm({ mode }: CommentAuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // Register
        const res = await fetch("/api/comment-auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: password || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Registration failed");
          return;
        }
        setSent(true);
        toast.success("Check your email for a verification link");
      } else {
        // Login via magic link
        const res = await fetch("/api/comment-auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Failed to send link");
          return;
        }
        setSent(true);
        toast.success("Check your email for a login link");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Mail className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="font-serif text-lg font-bold">Check your inbox</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a link to <strong>{email}</strong>. Click it to log in.
          It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              placeholder="Jane Doe"
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      {isRegister && (
        <div className="space-y-2">
          <Label htmlFor="password">Password (optional)</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              placeholder="Set a password (8+ chars)"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Optional — if set, you can log in with email + password instead of magic links.
          </p>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? "Create account" : "Send magic link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>Already have an account? <Link href="/comment-login" className="text-primary hover:underline">Log in</Link></>
        ) : (
          <>New here? <Link href="/comment-register" className="text-primary hover:underline">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
