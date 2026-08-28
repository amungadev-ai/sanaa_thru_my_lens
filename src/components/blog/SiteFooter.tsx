import Link from "next/link";
import { Instagram, Twitter, Mail, Rss } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="font-serif text-lg font-bold">ST</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold tracking-tight">Sanaa Thrumylens</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Art Through My Lens</span>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A Kenyan creative-arts blog documenting the music, literature, culture, and people
              shaping East Africa&apos;s creative economy — one story at a time.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@sanaathrumylens.co.ke"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="/rss"
                aria-label="RSS"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Sections */}
          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider">Sections</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/category/music-reviews" className="text-muted-foreground hover:text-primary">Music Reviews</Link></li>
              <li><Link href="/category/literature" className="text-muted-foreground hover:text-primary">Literature</Link></li>
              <li><Link href="/category/culture-opinion" className="text-muted-foreground hover:text-primary">Culture &amp; Opinion</Link></li>
              <li><Link href="/category/scene-reports" className="text-muted-foreground hover:text-primary">Scene Reports</Link></li>
              <li><Link href="/category/features" className="text-muted-foreground hover:text-primary">Features</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider">More</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/cms" className="text-muted-foreground hover:text-primary">Editor Login</Link></li>
              <li><Link href="/editor/login" className="text-muted-foreground hover:text-primary">Contributor Login</Link></li>
              <li><a href="mailto:hello@sanaathrumylens.co.ke" className="text-muted-foreground hover:text-primary">Pitch a Story</a></li>
              <li><a href="mailto:hello@sanaathrumylens.co.ke" className="text-muted-foreground hover:text-primary">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Sanaa Thrumylens. All rights reserved.</p>
          <p>
            Made with care in Nairobi ·{" "}
            <a href="https://www.saaathrumylens.co.ke" className="hover:text-primary">www.saaathrumylens.co.ke</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
