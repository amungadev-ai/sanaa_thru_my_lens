import { MediaGallery } from "@/components/media/MediaGallery";

export const revalidate = 10;

export default function EditorMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and upload images for your stories. Only admins can delete images.
        </p>
      </div>
      <MediaGallery canDelete={false} />
    </div>
  );
}
