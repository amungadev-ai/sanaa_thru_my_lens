"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MailX } from "lucide-react";

interface UnsubscribeFormProps {
  initialEmail: string;
}

export function UnsubscribeForm({ initialEmail }: UnsubscribeFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        toast.success("Unsubscribed");
      } else {
        toast.error(data.error ?? "Something went wrong");
        setStatus("idle");
      }
    } catch {
      toast.error("Network error");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-serif text-lg font-bold text-emerald-900">
          You&apos;ve been unsubscribed
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          You will no longer receive The Weekly Dispatch. If this was a mistake,
          you can always re-subscribe from our home page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs text-muted-foreground">Email address</Label>
        <div className="relative">
          <MailX className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-10"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={status === "loading"}
        variant="destructive"
        className="w-full"
      >
        {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Unsubscribe me
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You can re-subscribe at any time from our home page.
      </p>
    </form>
  );
}
