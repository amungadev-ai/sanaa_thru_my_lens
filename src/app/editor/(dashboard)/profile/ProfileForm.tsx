"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    bio: string;
    avatar: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);
  const [avatar, setAvatar] = useState(initialData.avatar);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/editor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email address is your login. Contact an admin if you need to change it.
        </p>
        <div className="mt-5">
          <Label htmlFor="email" className="text-xs text-muted-foreground">Email (read-only)</Label>
          <Input id="email" value={initialData.email} disabled className="mt-1 opacity-70" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Public Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This information appears on your stories and author page.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs text-muted-foreground">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown as the author on all your stories. Changing this updates all existing stories.
            </p>
          </div>
          <div>
            <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio telling readers who you are and what you write about."
              rows={4}
              className="mt-1 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="avatar" className="text-xs text-muted-foreground">Avatar URL (optional)</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://cdn.sanaathrumylens.co.ke/images/..."
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
