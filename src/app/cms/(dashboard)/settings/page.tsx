import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function CmsSettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  const admin = await db.adminUser.findFirst();

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

      {/* Deployment note */}
      <Card className="border-primary/30 bg-primary/5 p-6">
        <h3 className="font-serif text-base font-bold">Production deployment</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This sandbox runs on SQLite for development. To deploy to your production server
          (d7.my-control-panel.com) with the MySQL database you provided, switch the
          <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">prisma/schema.prisma</code>
          datasource provider from <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">sqlite</code>
          to <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">mysql</code> and set
          <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">DATABASE_URL</code>
          to your MySQL connection string.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-sidebar p-3 text-xs text-sidebar-foreground">
{`# .env (production)
DATABASE_URL="mysql://jobready_sanaa_test_admin:Admin254@d7.my-control-panel.com:3306/jobready_sanaa_test"
NEXTAUTH_SECRET="generate-a-strong-secret"
NEXTAUTH_URL="https://www.saaathrumylens.co.ke"`}
        </pre>
      </Card>
    </div>
  );
}
