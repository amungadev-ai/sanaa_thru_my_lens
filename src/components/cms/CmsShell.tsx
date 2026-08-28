"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Settings,
  Users,
  PenTool,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/cms", label: "Dashboard", icon: LayoutDashboard },
      { href: "/cms/posts", label: "Posts", icon: FileText },
      { href: "/cms/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "Team",
    items: [
      { href: "/cms/editors", label: "Editors", icon: PenTool },
      { href: "/cms/subscribers", label: "Subscribers", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/cms/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_SECTIONS.map((section, sIdx) => (
        <div key={sIdx}>
          {section.label && (
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40 first:mt-0">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active =
              item.href === "/cms"
                ? pathname === "/cms"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function CmsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/cms/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <Link href="/cms" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-serif text-sm font-bold">ST</span>
          </div>
          <span className="font-serif text-sm font-bold text-sidebar-foreground">CMS</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((v) => !v)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-sidebar p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="mt-12 space-y-1">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
          <Link href="/cms" className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="font-serif text-base font-bold">ST</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-sm font-bold text-sidebar-foreground">Sanaa Thrumylens</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">CMS Dashboard</span>
            </div>
          </Link>

          <Button
            asChild
            className="mb-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/cms/posts/new">
              <Plus className="mr-1.5 h-4 w-4" /> New Post
            </Link>
          </Button>

          <nav className="flex-1 space-y-1">
            <NavLinks pathname={pathname} />
          </nav>

          <div className="space-y-1 border-t border-sidebar-border pt-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-screen flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
