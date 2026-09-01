import { PostEditor } from "@/components/cms/PostEditor";
import { getCategories } from "@/lib/posts";
import { getCurrentEditor } from "@/lib/editor-auth";

export const revalidate = 10;

export default async function EditorNewPostPage() {
  const editor = await getCurrentEditor();
  if (!editor) return null;

  const categories = await getCategories();
  const authorName = editor.name ?? editor.email.split("@")[0];

  return (
    <PostEditor
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      apiBase="/api/editor/posts"
      redirectAfterSave="/editor/posts"
      initialData={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: categories[0]?.name ?? "Features",
        tags: "",
        author: authorName,
        coverImage: "",
        status: "DRAFT",
        featured: false,
        readingTime: 1,
      }}
    />
  );
}
