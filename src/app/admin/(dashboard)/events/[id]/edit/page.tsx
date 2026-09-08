import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/posts";
import { EventEditor } from "@/components/admin/EventEditor";

export const runtime = "nodejs";
export const revalidate = 10;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  const categories = await getCategories();

  // Format dates for datetime-local input
  const formatLocal = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <EventEditor
      mode="edit"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      initialData={{
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description ?? "",
        coverImage: event.coverImage ?? "",
        category: event.category ?? categories[0]?.name ?? "Music Reviews",
        venue: event.venue ?? "",
        city: event.city,
        address: event.address ?? "",
        startDate: formatLocal(event.startDate),
        endDate: event.endDate ? formatLocal(event.endDate) : "",
        ticketPrice: event.ticketPrice ?? "",
        ticketUrl: event.ticketUrl ?? "",
        eventUrl: event.eventUrl ?? "",
        status: event.status as "DRAFT" | "PUBLISHED",
      }}
    />
  );
}
