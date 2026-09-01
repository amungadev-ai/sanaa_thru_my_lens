import { getCachedSiteSettings, getCachedAdminUser } from "@/lib/data-cache";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./SettingsForm";

export const revalidate = 60;

export default async function CmsSettingsPage() {
  const settings = await getCachedSiteSettings().catch(() => null);
  const admin = await getCachedAdminUser().catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how Sanaa Thrumylens appears to readers.
        </p>
      </div>

      <SettingsForm
        settings={
          settings
            ? {
                siteName: settings.siteName,
                tagline: settings.tagline,
                description: settings.description ?? "",
                logoText: settings.logoText,
                socialInstagram: settings.socialInstagram ?? "",
                socialTwitter: settings.socialTwitter ?? "",
                socialFacebook: settings.socialFacebook ?? "",
                socialEmail: settings.socialEmail ?? "",
              }
            : null
        }
        adminEmail={admin?.email ?? "admin@sanaathrumylens.co.ke"}
      />

      {/* Database status */}
      <Card className="border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-serif text-base font-bold text-emerald-900">Database Connected</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-700">
          This site is connected to your production MySQL database on{" "}
          <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs">d7.my-control-panel.com</code>.
          All posts, categories, subscribers, and settings are stored in the{" "}
          <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs">jobready_sanaa_test</code>{" "}
          database.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-emerald-700 sm:grid-cols-2">
          <div>
            <span className="font-semibold">Host:</span> d7.my-control-panel.com:3306
          </div>
          <div>
            <span className="font-semibold">Database:</span> jobready_sanaa_test
          </div>
          <div>
            <span className="font-semibold">Engine:</span> MariaDB 10.6
          </div>
          <div>
            <span className="font-semibold">Tables:</span> Post, Category, AdminUser, Comment, SiteSettings, Subscriber
          </div>
        </div>
      </Card>
    </div>
  );
}
