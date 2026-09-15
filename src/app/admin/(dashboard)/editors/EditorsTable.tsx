"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Mail, Loader2, Copy, Check, XCircle, RotateCw, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";

interface EditorRow {
  id: string;
  email: string;
  name: string;
  status: string;
  postCount: number;
  createdAt: string;
  inviteToken?: string | null;
  inviteExpires?: string | null;
  lastLoginAt?: string | null;
  passwordSetAt?: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function isInviteExpired(expires: string | null | undefined): boolean {
  if (!expires) return true;
  return new Date(expires) < new Date();
}

export function EditorsTable({ editors }: { editors: EditorRow[] }) {
  const router = useRouter();
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSuspend = async (editor: EditorRow) => {
    const action = editor.status === "SUSPENDED" ? "reactivate" : "suspend";
    if (!confirm(`Are you sure you want to ${action} ${editor.email}?`)) return;
    setActionId(editor.id);
    try {
      const newStatus = editor.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      const res = await fetch(`/api/editors/${editor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? `Failed to ${action} editor`);
        return;
      }
      toast.success(`Editor ${action}ed${newStatus === "SUSPENDED" ? " (email sent)" : " (email sent)"}`);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Permanently remove ${email}? Their posts will remain but be unattributed.`)) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/editors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to remove editor");
        return;
      }
      toast.success("Editor removed (suspension email sent)");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  const handleResendInvite = async (id: string, email: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/editors/${id}/resend-invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to resend invite");
        return;
      }
      toast.success(`Invite resent to ${email}`);
      // Copy link to clipboard too
      if (data.inviteUrl) {
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
          toast.info("Invite link also copied to clipboard");
        } catch {}
      }
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  const handleRevokeInvite = async (id: string, email: string) => {
    if (!confirm(`Revoke invite for ${email}? The old link will stop working.`)) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/editors/${id}/revoke-invite`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to revoke invite");
        return;
      }
      toast.success("Invite revoked");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
    }
  };

  const copyInviteLink = async (id: string, token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sanaathrumylens.co.ke";
    const url = `${baseUrl}/editor/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("Invite link copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  if (editors.length === 0) {
    return (
      <div className="p-12 text-center">
        <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-serif text-lg font-bold">No editors yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite your first editor using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Editor</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Invite Link</th>
            <th className="px-4 py-3 font-medium">Posts</th>
            <th className="px-4 py-3 font-medium">Last Login</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {editors.map((e) => {
            const isPending = e.status === "PENDING";
            const isSuspended = e.status === "SUSPENDED";
            const inviteExpired = isPending && isInviteExpired(e.inviteExpires);
            const hasToken = !!e.inviteToken;

            return (
              <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                {/* Editor info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(e.name || e.email).split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <a href={`mailto:${e.email}`} className="font-medium hover:text-primary">{e.email}</a>
                      {e.name && <p className="text-xs text-muted-foreground">{e.name}</p>}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      e.status === "ACTIVE" && "bg-emerald-100 text-emerald-700",
                      e.status === "PENDING" && "bg-amber-100 text-amber-700",
                      e.status === "SUSPENDED" && "bg-red-100 text-red-700"
                    )}
                  >
                    {e.status === "PENDING" && inviteExpired ? "EXPIRED" : e.status}
                  </span>
                </td>

                {/* Invite link (only for PENDING with token) */}
                <td className="px-4 py-3">
                  {isPending && hasToken ? (
                    <div className="flex items-center gap-1">
                      {/* Copy link */}
                      <button
                        onClick={() => copyInviteLink(e.id, e.inviteToken!)}
                        title="Copy invite link"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        {copiedId === e.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                      {/* Resend email */}
                      <button
                        onClick={() => handleResendInvite(e.id, e.email)}
                        disabled={actionId === e.id}
                        title="Resend invite email"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        {actionId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                      </button>
                      {/* Revoke */}
                      <button
                        onClick={() => handleRevokeInvite(e.id, e.email)}
                        disabled={actionId === e.id}
                        title="Revoke invite"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : isPending && !hasToken ? (
                    <button
                      onClick={() => handleResendInvite(e.id, e.email)}
                      disabled={actionId === e.id}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {actionId === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Re-invite"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Posts */}
                <td className="px-4 py-3 text-muted-foreground">{e.postCount}</td>

                {/* Last login */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatLastSeen(e.lastLoginAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Suspend / Reactivate */}
                    <button
                      onClick={() => handleSuspend(e)}
                      disabled={actionId === e.id}
                      title={isSuspended ? "Reactivate" : "Suspend"}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        isSuspended
                          ? "text-emerald-600 hover:bg-emerald-100"
                          : "text-muted-foreground hover:bg-amber-100 hover:text-amber-700"
                      )}
                    >
                      {actionId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isSuspended ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </button>

                    {/* Delete (permanent) */}
                    <button
                      onClick={() => handleDelete(e.id, e.email)}
                      disabled={actionId === e.id}
                      title="Delete editor"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {actionId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
