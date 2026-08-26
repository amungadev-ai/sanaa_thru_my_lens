import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CmsCategoriesPage() {
  const [categories, counts] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.post.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(c.category ?? "", c._count._all);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the editorial sections readers see on the site.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-base font-bold">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">/{c.slug}</p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {countMap.get(c.name) ?? 0} posts
                </span>
              </div>
              {c.description && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
              )}
              <Link
                href={`/category/${c.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                View on site →
              </Link>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Add or edit a category</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the form below to create a new section. Existing categories can be renamed — slugs
          should be kebab-case.
        </p>
        <CategoryManager categories={categories} />
      </Card>
    </div>
  );
}
