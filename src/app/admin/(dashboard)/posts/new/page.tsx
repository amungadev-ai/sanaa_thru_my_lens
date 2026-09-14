import { PostEditor } from "@/components/cms/PostEditor";
import { getCategories } from "@/lib/posts";
import { getCachedAllEditorsForAssignment } from "@/lib/data-cache";

export const runtime = "nodejs";
export const revalidate = 10;

export default async function NewPostPage() {
  const [categories, editors] = await Promise.all([
    getCategories(),
    getCachedAllEditorsForAssignment().catch(() => []),
  ]);

  return (
    <PostEditor
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      editors={editors.map((e) => ({ id: e.id, name: e.name, email: e.email }))}
      initialData={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: categories[0]?.name ?? "Features",
        tags: "",
        author: "Sanaa Thrumylens",
        coverImage: "",
        status: "DRAFTING",
        featured: false,
        readingTime: 1,
        scheduledAt: null,
        calendarNote: null,
      }}
    />
  );
}
