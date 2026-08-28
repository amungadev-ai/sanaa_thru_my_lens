import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SearchInput } from "@/components/blog/SearchInput";
import { getPublishedPosts } from "@/lib/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search stories across Sanaa Thrumylens.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const all = await getPublishedPosts({ limit: 100 });

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-secondary/20">
          <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
            <h1 className="display-serif text-3xl text-foreground md:text-5xl">Search</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Find stories by title, category or keyword.
            </p>
            <div className="mt-5">
              <SearchInput posts={all} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div id="search-results" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {all.slice(0, 9).map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
