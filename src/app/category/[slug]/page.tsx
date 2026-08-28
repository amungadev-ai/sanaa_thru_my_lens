import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { getPublishedPosts, getCategoryBySlug } from "@/lib/posts";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} — Sanaa Thrumylens`,
    description: category.description ?? `Articles in the ${category.name} section.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await getPublishedPosts({ category: category.name, limit: 50 });

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1">
        {/* Category header */}
        <section className="border-b border-border bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Section</p>
            <h1 className="display-serif mt-2 text-4xl text-foreground md:text-5xl">{category.name}</h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                {category.description}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "story" : "stories"} in this section
            </p>
          </div>
        </section>

        {/* Posts grid */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-serif text-xl font-bold">No stories yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re still writing in this section. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
