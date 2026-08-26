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

interface SettingsData {
  siteName: string;
  tagline: string;
  description: string;
  logoText: string;
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  socialEmail: string;
}

interface SettingsFormProps {
  settings: SettingsData | null;
  adminEmail: string;
}

export function SettingsForm({ settings, adminEmail }: SettingsFormProps) {
  const router = useRouter();
  const [data, setData] = useState<SettingsData>(
    settings ?? {
      siteName: "Sanaa Thrumylens",
      tagline: "Art Through My Lens",
      description: "",
      logoText: "ST",
      socialInstagram: "",
      socialTwitter: "",
      socialFacebook: "",
      socialEmail: "",
    }
  );
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Save failed");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Site identity */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Site Identity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How the site introduces itself to readers.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="siteName" className="text-xs text-muted-foreground">Site Name</Label>
            <Input
              id="siteName"
              value={data.siteName}
              onChange={(e) => update("siteName", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tagline" className="text-xs text-muted-foreground">Tagline</Label>
            <Input
              id="tagline"
              value={data.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="logoText" className="text-xs text-muted-foreground">Logo Mark (2 letters)</Label>
            <Input
              id="logoText"
              value={data.logoText}
              maxLength={3}
              onChange={(e) => update("logoText", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="description" className="text-xs text-muted-foreground">Site Description (for SEO)</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="mt-1 resize-none"
          />
        </div>
      </Card>

      {/* Social */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Social &amp; Contact</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Where readers can find and reach you.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="socialInstagram" className="text-xs text-muted-foreground">Instagram handle</Label>
            <Input
              id="socialInstagram"
              value={data.socialInstagram}
              onChange={(e) => update("socialInstagram", e.target.value)}
              placeholder="@sanaathrumylens"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="socialTwitter" className="text-xs text-muted-foreground">Twitter / X handle</Label>
            <Input
              id="socialTwitter"
              value={data.socialTwitter}
              onChange={(e) => update("socialTwitter", e.target.value)}
              placeholder="@sanaathrumylens"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="socialFacebook" className="text-xs text-muted-foreground">Facebook URL</Label>
            <Input
              id="socialFacebook"
              value={data.socialFacebook}
              onChange={(e) => update("socialFacebook", e.target.value)}
              placeholder="facebook.com/sanaathrumylens"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="socialEmail" className="text-xs text-muted-foreground">Contact email</Label>
            <Input
              id="socialEmail"
              type="email"
              value={data.socialEmail}
              onChange={(e) => update("socialEmail", e.target.value)}
              placeholder="hello@sanaathrumylens.co.ke"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-bold">Editor Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The email you use to sign in. To change the password, contact your site administrator.
        </p>
        <div className="mt-5">
          <Label htmlFor="adminEmail" className="text-xs text-muted-foreground">Admin email</Label>
          <Input id="adminEmail" value={adminEmail} disabled className="mt-1 opacity-70" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
