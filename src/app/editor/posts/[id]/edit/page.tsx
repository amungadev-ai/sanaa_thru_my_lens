import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/posts";
import { getCurrentEditor } from "@/lib/editor-auth";
import { PostEditor } from "@/components/cms/PostEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorEditPostPage({ params }: PageProps) {
  const { id } = await params;
  const editor = await getCurrentEditor();
  if (!editor) return null;

  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.authorId !== editor.id) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <PostEditor
      mode="edit"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      apiBase="/api/editor/posts"
      redirectAfterSave="/editor/posts"
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
