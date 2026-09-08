import { EventEditor } from "@/components/admin/EventEditor";
import { getCategories } from "@/lib/posts";

export const runtime = "nodejs";
export const revalidate = 10;

export default async function NewEventPage() {
  const categories = await getCategories();

  return (
    <EventEditor
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      initialData={{
        title: "",
        slug: "",
        description: "",
        coverImage: "",
        category: categories[0]?.name ?? "Music Reviews",
        venue: "",
        city: "Nairobi",
        address: "",
        startDate: "",
        endDate: "",
        ticketPrice: "",
        ticketUrl: "",
        eventUrl: "",
        status: "DRAFT",
      }}
    />
  );
}
