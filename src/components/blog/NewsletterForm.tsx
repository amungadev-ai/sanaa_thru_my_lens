"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  variant?: "card" | "inline";
  className?: string;
}

export function NewsletterForm({ variant = "card", className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "WEBSITE" }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col gap-2 sm:flex-row ${className ?? ""}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === "loading"}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </button>
        {status === "success" && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </p>
        )}
        {status === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {message}
          </p>
        )}
      </form>
    );
  }

  // Card variant (default)
  return (
    <div className={`rounded-lg border border-primary/30 bg-primary/5 p-6 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-bold">The Weekly Dispatch</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        One email every Friday — the best new stories, plus a curated pick from
        Nairobi&apos;s creative scene. No spam, ever.
      </p>

      {status === "success" ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-serif text-sm font-bold text-emerald-900">You&apos;re subscribed!</p>
              <p className="mt-0.5 text-xs text-emerald-700">{message}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatus("idle");
              setMessage("");
            }}
            className="mt-3 text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
          >
            Subscribe another email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Subscribing…
              </span>
            ) : (
              "Subscribe"
            )}
          </button>
          {status === "error" && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {message}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            By subscribing, you agree to receive one email per week. Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  );
}
