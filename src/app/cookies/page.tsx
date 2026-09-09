import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Sanaa Thrumylens uses cookies and how to manage them.",
};

export const runtime = "nodejs";

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <h1 className="display-serif text-3xl text-foreground md:text-4xl">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

          <div className="article-prose mt-8">
            <p>
              This Cookie Policy explains how Sanaa Thrumylens uses cookies and similar technologies
              on <strong>www.saaathrumylens.co.ke</strong>. This policy should be read alongside our{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>

            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by websites you visit. They allow
              the website to remember your actions and preferences over a period of time, so you
              don&apos;t have to re-enter information each time you visit.
            </p>

            <h2>2. Types of Cookies We Use</h2>
            <p>We use the following categories of cookies:</p>

            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the Site to function. They enable authentication
              (logging in as admin, editor, or reader), and without them you cannot use features like
              commenting or the CMS dashboard.
            </p>
            <ul>
              <li><strong>st_admin_session</strong> — admin login session (7 days)</li>
              <li><strong>st_editor_session</strong> — editor login session (7 days)</li>
              <li><strong>st_reader_session</strong> — reader/commenter login session (30 days)</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>
              We use your browser&apos;s <strong>localStorage</strong> (not cookies) to remember
              which articles you&apos;ve recently read. This data stays on your device and is never
              sent to our servers. You can clear it by clearing your browser data.
            </p>

            <h3>Analytics Cookies (If Applicable)</h3>
            <p>
              If we enable analytics tools (such as Google Analytics or Vercel Analytics), they may
              set cookies to collect anonymised usage data. This helps us understand which articles
              are popular and how visitors navigate the Site.
            </p>

            <h3>Advertising Cookies (If Applicable)</h3>
            <p>
              If we enable Google AdSense, Google may set cookies to serve relevant ads based on your
              visit to our Site and other sites. You can opt out of personalised advertising by
              visiting{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
                Google Ad Settings
              </a>.
            </p>

            <h2>3. Third-Party Cookies</h2>
            <p>
              Some cookies are set by third-party services we use:
            </p>
            <ul>
              <li><strong>Email links:</strong> When you click a magic link from our email, no cookies are set by the email service itself</li>
              <li><strong>Google Maps:</strong> If you click a venue link on an event page, Google Maps may set cookies on their site</li>
              <li><strong>Google Calendar:</strong> If you add an event to Google Calendar, Google may set cookies</li>
            </ul>

            <h2>4. Managing Cookies</h2>
            <p>
              You can control and delete cookies through your browser settings. Here&apos;s how:
            </p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a>
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Edge</a>
              </li>
            </ul>
            <p>
              <strong>Note:</strong> Disabling essential cookies will prevent you from logging in,
              commenting, and using other interactive features of the Site.
            </p>

            <h2>5. Cookie Duration</h2>
            <p>
              Session cookies (for authentication) expire after the durations listed above (7-30 days)
              or when you log out. Analytics and advertising cookies (if enabled) typically persist
              for up to 2 years.
            </p>

            <h2>6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy when we introduce new features or third-party services.
              The &ldquo;Last updated&rdquo; date at the top indicates when the policy was last revised.
            </p>

            <h2>7. Contact</h2>
            <p>
              If you have questions about our use of cookies, contact us at{" "}
              <a href="mailto:hello@sanaathrumylens.co.ke">hello@sanaathrumylens.co.ke</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
