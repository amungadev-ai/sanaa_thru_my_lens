import { MediaGallery } from "@/components/media/MediaGallery";

export const revalidate = 10;

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse, upload, and manage images on the CDN. Delete images you no longer need.
        </p>
      </div>
      <MediaGallery canDelete={true} />
    </div>
  );
}
