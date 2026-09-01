import Link from "next/link";
import { getCachedAllEditors, getCachedEditorStats } from "@/lib/data-cache";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, UserCheck, UserX, Clock } from "lucide-react";
import { InviteEditorDialog } from "./InviteEditorDialog";
import { EditorsTable } from "./EditorsTable";

export const revalidate = 30;

export default async function CmsEditorsPage() {
  const [editors, stats] = await Promise.all([
    getCachedAllEditors().catch(() => []),
    getCachedEditorStats().catch(() => []),
  ]);

  const statMap = new Map<string, number>();
  for (const s of stats) statMap.set(s.status, s._count._all);

  const cards = [
    {
      label: "Total Editors",
      value: editors.length,
      sub: "All-time invites",
      icon: Users,
    },
    {
      label: "Active",
      value: statMap.get("ACTIVE") ?? 0,
      sub: "Can log in and write",
      icon: UserCheck,
    },
    {
      label: "Pending",
      value: statMap.get("PENDING") ?? 0,
      sub: "Invited, not yet activated",
      icon: Clock,
    },
    {
      label: "Suspended",
      value: statMap.get("SUSPENDED") ?? 0,
      sub: "Access revoked",
      icon: UserX,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Editors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite writers to contribute to Sanaa Thrumylens. Editors can write and publish
            their own stories.
          </p>
        </div>
        <InviteEditorDialog />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-serif text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* How it works */}
      <Card className="border-primary/30 bg-primary/5 p-5">
        <h3 className="font-serif text-sm font-bold">How editor onboarding works</h3>
        <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>1. Admin invites an editor by entering their email</li>
          <li>2. Editor receives an email with a secure invite link (expires in 7 days)</li>
          <li>3. Editor clicks the link and sets their password</li>
          <li>4. Editor logs in at <code className="rounded bg-secondary px-1 py-0.5">/editor/login</code> and can write stories</li>
          <li>5. Admin can suspend access at any time (editor&apos;s posts remain)</li>
        </ol>
      </Card>

      {/* Editors table */}
      <Card className="p-0">
        <EditorsTable editors={editors.map((e) => ({
          id: e.id,
          email: e.email,
          name: e.name ?? "",
          status: e.status,
          postCount: e._count.posts,
          createdAt: e.createdAt.toISOString(),
        }))} />
      </Card>
    </div>
  );
}
