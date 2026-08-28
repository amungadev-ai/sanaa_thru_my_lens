import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/posts";
import { PostEditor } from "@/components/cms/PostEditor";

export const revalidate = 10;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();
  const categories = await getCategories();

  return (
    <PostEditor
      mode="edit"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category ?? categories[0]?.name ?? "Features",
        tags: post.tags,
        author: post.author,
        coverImage: post.coverImage ?? "",
        status: post.status as "PUBLISHED" | "DRAFT",
        featured: post.featured,
        readingTime: post.readingTime,
      }}
    />
  );
}
