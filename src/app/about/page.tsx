import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { getCategories } from "@/lib/posts";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Sanaa Thrumylens is an independent Kenyan creative-arts blog documenting the music, literature, culture and people shaping East Africa's creative economy.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const categories = await getCategories();
  const totalPosts = await db.post.count({ where: { status: "PUBLISHED" } });
  const totalViews = await db.post.aggregate({ _sum: { views: true } });

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-secondary/20">
          <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About Us</p>
            <h1 className="display-serif mt-3 text-4xl text-foreground md:text-6xl">
              We document Kenya&apos;s <em className="text-primary">creative</em> pulse.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Sanaa Thrumylens — &ldquo;Art Through My Lens&rdquo; — is an independent
              creative-arts blog publishing slow, considered writing on the music,
              literature, culture and people shaping East Africa&apos;s creative economy.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Our Mission</h2>
          <div className="article-prose mt-6">
            <p>
              Kenyan creativity has always been louder than the platforms that carry it.
              From the boom of benga and the rise of Gengetone, to a new wave of literary
              voices and the visual artists reimagining what &ldquo;African&rdquo; looks like —
              the work is being made. What&apos;s often missing is writing that takes that work
              seriously.
            </p>
            <p>
              Sanaa Thrumylens exists to fill that gap. We are an independent, editor-led
              publication focused on long-form reviews, essays, and scene reports — the kind
              of writing that an artist deserves after months in the studio, on the road, or
              at the page. We are not a news outlet chasing clicks. We are a magazine for
              readers who care about craft.
            </p>
            <p>
              Our scope is intentionally wide: music, literature, film, visual art, fashion,
              and the events that bring them all together. What unites our coverage is a
              Kenyan point of view and a belief that local critics should write about local
              art with the same rigour and respect given to international work.
            </p>
            <h2>What we publish</h2>
            <p>
              We organise our coverage into five sections. <strong>Music Reviews</strong> covers
              albums, EPs and music videos with the seriousness they deserve — no 280-character
              verdicts. <strong>Literature</strong> tracks the Kenyan writing scene, from
              new releases to the literary infrastructure around them. <strong>Culture &amp;
              Opinion</strong> is where we argue, contextualise, and occasionally disagree with
              ourselves. <strong>Scene Reports</strong> takes you inside the events shaping the
              conversation, and <strong>Features</strong> is our home for slower, longer
              storytelling.
            </p>
            <h2>How we work</h2>
            <p>
              Sanaa Thrumylens is independently run. We do not accept paid reviews. When we
              cover a project by an artist we have a personal relationship with, we say so.
              Our editorial calendar is built weeks ahead, and we publish when a piece is
              ready — not when an algorithm demands it.
            </p>
            <p>
              We welcome pitches from writers, photographers and illustrators, especially
              those based in Kenya and the wider East African region. If you have a story
              you think we should be telling, write to us at{" "}
              <a href="mailto:hello@sanaathrumylens.co.ke">hello@sanaathrumylens.co.ke</a>.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="display-serif text-4xl text-primary">{totalPosts}</p>
                <p className="mt-1 text-sm text-muted-foreground">Stories published</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="display-serif text-4xl text-primary">{categories.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Editorial sections</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="display-serif text-4xl text-primary">
                  {(totalViews._sum.views ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Total reads</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="font-serif text-2xl font-bold">Have a story to tell?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re always looking for new voices — writers, photographers, illustrators.
            </p>
            <a
              href="mailto:hello@sanaathrumylens.co.ke"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Pitch a story
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
