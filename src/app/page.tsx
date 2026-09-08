import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { HeroCarousel } from "@/components/blog/HeroCarousel";
import { EventsSidebar } from "@/components/blog/EventsSidebar";
import {
  getCachedPublishedPosts,
  getCachedFeaturedPost,
  getCachedCategories,
  getCachedSubscriberCount,
  getCachedPostCountsByCategory,
} from "@/lib/data-cache";
import type { PublicPost } from "@/lib/posts";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export const runtime = "nodejs";
export const revalidate = 300;

function toPublicPost(p: Awaited<ReturnType<typeof getCachedPublishedPosts>>[number]): PublicPost {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    category: p.category,
    tags: p.tags,
    author: p.author,
    views: p.views,
    readingTime: p.readingTime,
    createdAt: p.createdAt,
    featured: p.featured,
  };
}

export default async function HomePage() {
  const [featuredRaw, recentRaw, categories, subscriberCount, postCountsByCategory] = await Promise.all([
    getCachedFeaturedPost(),
    getCachedPublishedPosts(10),
    getCachedCategories(),
    getCachedSubscriberCount(),
    getCachedPostCountsByCategory(),
  ]);

  const featured = featuredRaw ? toPublicPost(featuredRaw) : null;
  const recent = recentRaw.map(toPublicPost);

  // Build carousel slides from featured + top recent posts
  const carouselPosts = featured
    ? [featured, ...recent.filter((p) => p.id !== featured.id).slice(0, 4)]
    : recent.slice(0, 5);

  // Top grid (3 stories — in the 2-column layout with sidebar)
  const topGrid = recent.filter((p) => p.id !== featured?.id).slice(0, 3);

  // More stories (horizontal list below the grid)
  const moreStories = recent.filter((p) => p.id !== featured?.id && !topGrid.some((g) => g.id === p.id)).slice(0, 4);

  // Category counts
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
        {/* Hero Carousel */}
        {carouselPosts.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
            <HeroCarousel
              slides={carouselPosts.map((p) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                excerpt: p.excerpt,
                coverImage: p.coverImage ?? "/images/covers/default.svg",
                category: p.category,
                author: p.author,
                readingTime: p.readingTime,
              }))}
            />
          </section>
        )}

        {/* Featured post (Editor's Pick) */}
        {featured && (
          <section className="mx-auto max-w-7xl px-4 pb-6 md:px-6">
            <div className="mb-4 flex items-end justify-between">
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

        {/* Categories band */}
        <section className="border-y border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <h2 className="font-serif text-2xl font-bold">Explore by Category</h2>
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

        {/* Latest Stories + sidebar (2-column from here) */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main column */}
            <div>
              {/* Latest Stories grid */}
              {topGrid.length > 0 && (
                <>
                  <h2 className="font-serif text-2xl font-bold">Latest Stories</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Fresh from the Sanaa Thrumylens desk.</p>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                    {topGrid.map((post) => (
                      <ArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}

              {/* More Stories */}
              {moreStories.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-serif text-2xl font-bold">More Stories</h2>
                  <div className="mt-6 divide-y divide-border">
                    {moreStories.map((post) => (
                      <ArticleCard key={post.id} post={post} variant="horizontal" className="py-6 first:pt-0" />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/40"
                >
                  View more stories <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Events widget */}
              <EventsSidebar />

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

              {/* Most Read */}
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

              {/* Newsletter */}
              <NewsletterForm />
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
