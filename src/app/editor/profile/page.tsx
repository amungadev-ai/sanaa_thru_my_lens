import { getCurrentEditor } from "@/lib/editor-auth";
import { ProfileForm } from "./ProfileForm";

export const revalidate = 30;

export const metadata = {
  title: "My Profile",
};

export default async function EditorProfilePage() {
  const editor = await getCurrentEditor();
  if (!editor) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your display name and bio. Your name appears as the author on your stories.
        </p>
      </div>

      <ProfileForm
        initialData={{
          name: editor.name ?? "",
          email: editor.email,
          bio: editor.bio ?? "",
          avatar: editor.avatar ?? "",
        }}
      />
    </div>
  );
}
