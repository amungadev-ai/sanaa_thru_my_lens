import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { getPublishedPosts, getFeaturedPost, getCategories } from "@/lib/posts";
import { db, withRetry } from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";

// Cache the page for 5 minutes, then regenerate in the background.
// This dramatically reduces database load — most visitors get a cached page
// with ZERO database queries.
export const revalidate = 300;

export default async function HomePage() {
  // Run all independent queries in parallel (3 DB calls instead of 9+)
  const [featured, recent, categories, subscriberCount, postCountsByCategory] = await Promise.all([
    getFeaturedPost(),
    getPublishedPosts({ limit: 7 }),
    getCategories(),
    withRetry(() => db.subscriber.count({ where: { status: "ACTIVE" } })),
    // Single groupBy query replaces N individual count queries
    withRetry(() =>
      db.post.groupBy({
        by: ["category"],
        where: { status: "PUBLISHED" },
        _count: { _all: true },
      })
    ),
  ]);

  // Split recent: first 3 for top grid, next 4 for "More Stories" sidebar
  const topGrid = recent.filter((p) => p.id !== featured?.id).slice(0, 3);
  const moreStories = recent.filter((p) => p.id !== featured?.id).slice(3, 7);

  // Merge the groupBy results into the categories array
  const countMap = new Map<string, number>();
  for (const c of postCountsByCategory) {
    if (c.category) countMap.set(c.category, c._count._all);
  }
  const categoryCounts = categories.map((c) => ({
    ...c,
    count: countMap.get(c.name) ?? 0,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero / Intro band */}
        <section className="border-b border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <div className="flex flex-col items-start gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                Kenyan Creative Arts · Est. 2025
              </div>
              <h1 className="display-serif max-w-4xl text-4xl leading-[1.05] text-foreground md:text-6xl">
                Art, <em className="text-primary">through</em> my lens.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Long-form reviews, essays and scene reports on the music, literature,
                culture and people defining Kenya&apos;s creative economy — written from Nairobi,
                read everywhere.
              </p>
            </div>
          </div>
        </section>

        {/* Featured post */}
        {featured && (
          <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">Editor&apos;s Pick</h2>
                <p className="mt-1 text-sm text-muted-foreground">The story we&apos;re spotlighting this week.</p>
              </div>
              <Link href="/category/features" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
                All features <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ArticleCard post={featured} variant="featured" priority />
          </section>
        )}

        {/* Top grid */}
        {topGrid.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 md:pb-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold">Latest Stories</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fresh from the Sanaa Thrumylens desk.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topGrid.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Categories band */}
        <section className="border-y border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
            <h2 className="font-serif text-2xl font-bold">Explore by Section</h2>
            <p className="mt-1 text-sm text-muted-foreground">Five beats, one obsession: Kenya&apos;s creative pulse.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {categoryCounts.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="font-serif text-base font-bold leading-tight group-hover:text-primary">
                    {cat.name}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {cat.description}
                  </span>
                  <span className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.count} {cat.count === 1 ? "story" : "stories"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* More stories + sidebar */}
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main column */}
            <div>
              <h2 className="font-serif text-2xl font-bold">More Stories</h2>
              <div className="mt-6 divide-y divide-border">
                {moreStories.map((post) => (
                  <ArticleCard key={post.id} post={post} variant="horizontal" className="py-6 first:pt-0" />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* About blurb */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-bold">About Sanaa Thrumylens</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Sanaa Thrumylens — &ldquo;Art Through My Lens&rdquo; — is an independent
                  creative-arts blog documenting Kenya&apos;s music, literature, culture and the
                  people shaping East Africa&apos;s creative economy. We publish slow, considered
                  writing for readers who care about the craft.
                </p>
                <Link
                  href="/about"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Popular */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-bold">Most Read</h3>
                <ol className="mt-4 space-y-4">
                  {[...recent]
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 4)
                    .map((post, i) => (
                      <li key={post.id} className="flex gap-3">
                        <span className="font-serif text-2xl font-bold leading-none text-primary/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <ArticleCard post={post} variant="compact" className="flex-1" />
                      </li>
                    ))}
                </ol>
              </div>

              {/* Newsletter */}
              <NewsletterForm />

              {/* Subscriber count */}
              {subscriberCount > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      Join <strong className="font-bold text-foreground">{subscriberCount.toLocaleString()}</strong>{" "}
                      {subscriberCount === 1 ? "reader" : "readers"} already getting The Weekly Dispatch.
                    </span>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
