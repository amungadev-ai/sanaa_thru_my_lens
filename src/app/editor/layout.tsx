import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/editor-auth";
import { EditorShell } from "@/components/editor/EditorShell";


export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/editor/login");

  return (
    <EditorShell
      editor={{
        id: editor.id,
        name: editor.name,
        email: editor.email,
        avatar: editor.avatar,
      }}
    >
      {children}
    </EditorShell>
  );
}
