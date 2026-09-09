import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sanaa Thrumylens collects, uses, and protects your data.",
};

export const runtime = "nodejs";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <h1 className="display-serif text-3xl text-foreground md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

          <div className="article-prose mt-8">
            <p>
              Sanaa Thrumylens (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates
              the website <strong>www.saaathrumylens.co.ke</strong> (the &ldquo;Site&rdquo;). This
              Privacy Policy explains how we collect, use, and protect your personal information when
              you visit our Site, subscribe to our newsletter, or engage with our content.
            </p>
            <p>
              We are committed to protecting your privacy and complying with the Kenya Data
              Protection Act, 2019, and any other applicable data protection laws.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul>
              <li>
                <strong>Newsletter subscriptions:</strong> When you subscribe to The Weekly Dispatch,
                we collect your email address and optionally your name.
              </li>
              <li>
                <strong>Comments:</strong> When you comment on an article, we collect your name, email
                address, and the content of your comment. Your first comment requires moderation
                approval before it appears.
              </li>
              <li>
                <strong>Reader accounts:</strong> If you create an account to comment, we store your
                email address, name, and an optionally-set password (stored as a bcrypt hash).
              </li>
              <li>
                <strong>Analytics data:</strong> We may use analytics tools to understand how visitors
                use our Site. This includes aggregate, anonymised data such as page views, reading
                time, and general location.
              </li>
              <li>
                <strong>Recently read articles:</strong> We use your browser&apos;s localStorage to
                track which articles you&apos;ve read, so we can show a &ldquo;Recently Read&rdquo;
                section. This data stays on your device and is never sent to our servers.
              </li>
              <li>
                <strong>Cookies:</strong> We use essential cookies for authentication (admin, editor,
                and reader sessions) and may use analytics cookies. See our{" "}
                <a href="/cookies">Cookie Policy</a> for details.
              </li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your personal information to:</p>
            <ul>
              <li>Send you The Weekly Dispatch newsletter (only if you&apos;ve subscribed)</li>
              <li>Notify you when your comment is approved or when someone replies to your comment</li>
              <li>Send you a magic link to log in and comment</li>
              <li>Improve our content and understand which stories resonate with readers</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>
              We <strong>never</strong> sell your personal information to third parties. We do not
              share your email address with advertisers.
            </p>

            <h2>3. Legal Basis for Processing</h2>
            <p>
              Under the Kenya Data Protection Act, 2019, we process your personal data based on:
            </p>
            <ul>
              <li><strong>Consent:</strong> You voluntarily provide your email when subscribing or commenting</li>
              <li><strong>Legitimate interest:</strong> We use analytics to improve our service</li>
              <li><strong>Legal obligation:</strong> We may retain data as required by law</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain subscriber data for as long as you remain subscribed. You can unsubscribe at
              any time via the link in any email or at <a href="/unsubscribe">/unsubscribe</a>. Comment
              data is retained indefinitely as part of the article&apos;s comment thread. Reader
              account data is retained until you request deletion.
            </p>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
              <li>Unsubscribe from our newsletter at any time</li>
              <li>Object to the processing of your data</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href="mailto:hello@sanaathrumylens.co.ke">hello@sanaathrumylens.co.ke</a>.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We take reasonable measures to protect your data, including encrypted password hashing
              (bcrypt), secure cookies, HTTPS connections, and restricted database access. However,
              no method of transmission over the internet is 100% secure.
            </p>

            <h2>7. Third-Party Services</h2>
            <p>
              We use the following third-party services that may process your data:
            </p>
            <ul>
              <li><strong>Email delivery:</strong> Our SMTP mail server for sending newsletters and magic links</li>
              <li><strong>CDN:</strong> Our content delivery network for serving images</li>
              <li><strong>Hosting:</strong> Our web hosting provider for database and file storage</li>
            </ul>
            <p>
              If we introduce Google AdSense, Google may set cookies and collect data as described in
              their privacy policy. We will update this policy if that happens.
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p>
              Our Site is not directed to children under 16. We do not knowingly collect personal
              information from children. If you believe we have collected data from a child, please
              contact us and we will delete it.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify subscribers of
              significant changes via email. The &ldquo;Last updated&rdquo; date at the top of this
              page indicates when the policy was last revised.
            </p>

            <h2>10. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or your personal data, please
              contact us at{" "}
              <a href="mailto:hello@sanaathrumylens.co.ke">hello@sanaathrumylens.co.ke</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
