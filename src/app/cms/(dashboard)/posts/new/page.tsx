import { PostEditor } from "@/components/cms/PostEditor";
import { getCategories } from "@/lib/posts";

export const revalidate = 10;

export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <PostEditor
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      initialData={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: categories[0]?.name ?? "Features",
        tags: "",
        author: "Sanaa Thrumylens",
        coverImage: "",
        status: "DRAFT",
        featured: false,
        readingTime: 1,
      }}
    />
  );
}
