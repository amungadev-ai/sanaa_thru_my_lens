"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditorRow {
  id: string;
  email: string;
  name: string;
  status: string;
  postCount: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EditorsTable({ editors }: { editors: EditorRow[] }) {
  const router = useRouter();
  const [actionId, setActionId] = useState<string | null>(null);

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
        toast.error(`Failed to ${action} editor`);
        return;
      }
      toast.success(`Editor ${action}d`);
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
      toast.success("Editor removed");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setActionId(null);
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
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Posts</th>
            <th className="px-4 py-3 font-medium">Invited</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {editors.map((e) => (
            <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-3">
                <a href={`mailto:${e.email}`} className="font-medium hover:text-primary">
                  {e.email}
                </a>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{e.name || "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    e.status === "ACTIVE" && "bg-emerald-100 text-emerald-700",
                    e.status === "PENDING" && "bg-amber-100 text-amber-700",
                    e.status === "SUSPENDED" && "bg-stone-200 text-stone-600"
                  )}
                >
                  {e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{e.postCount}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(e.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {e.status !== "PENDING" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuspend(e)}
                      disabled={actionId === e.id}
                      className="text-xs"
                    >
                      {actionId === e.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : e.status === "SUSPENDED" ? (
                        "Reactivate"
                      ) : (
                        "Suspend"
                      )}
                    </Button>
                  )}
                  <button
                    onClick={() => handleDelete(e.id, e.email)}
                    disabled={actionId === e.id}
                    title="Remove editor"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {actionId === e.id ? (
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
