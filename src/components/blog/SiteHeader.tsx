"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/category/music-reviews", label: "Music" },
  { href: "/category/literature", label: "Literature" },
  { href: "/category/culture-opinion", label: "Culture" },
  { href: "/category/scene-reports", label: "Scene" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <span className="font-serif text-lg font-bold">ST</span>
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="font-serif text-base font-bold tracking-tight">Sanaa Thrumylens</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Art Through My Lens</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
          >
            <Link href="/search" aria-label="Search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/admin">Admin</Link>
          </Button>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-foreground/80 hover:bg-secondary/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
