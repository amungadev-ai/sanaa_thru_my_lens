"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriberRow {
  id: string;
  email: string;
  name: string;
  status: string;
  source: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscribersTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from your subscriber list?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete subscriber");
        return;
      }
      toast.success("Subscriber removed");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (sub: SubscriberRow) => {
    const newStatus = sub.status === "ACTIVE" ? "UNSUBSCRIBED" : "ACTIVE";
    try {
      const res = await fetch(`/api/subscribers/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      toast.success(newStatus === "ACTIVE" ? "Re-activated" : "Unsubscribed");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  };

  if (subscribers.length === 0) {
    return (
      <div className="p-12 text-center">
        <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-serif text-lg font-bold">No subscribers yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          As readers subscribe via the newsletter form on your site, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((s) => (
            <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-3">
                <a
                  href={`mailto:${s.email}`}
                  className="font-medium hover:text-primary"
                >
                  {s.email}
                </a>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{s.name || "—"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleStatus(s)}
                  title="Toggle status"
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      s.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-200 text-stone-600"
                    )}
                  >
                    {s.status}
                  </span>
                </button>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{s.source}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={`mailto:${s.email}`}
                    title="Send email"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(s.id, s.email)}
                    disabled={deletingId === s.id}
                    title="Delete"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
