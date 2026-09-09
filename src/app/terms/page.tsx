import { SiteHeader } from "@/components/blog/SiteHeader";
import { SiteFooter } from "@/components/blog/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using Sanaa Thrumylens.",
};

export const runtime = "nodejs";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
          <h1 className="display-serif text-3xl text-foreground md:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

          <div className="article-prose mt-8">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Sanaa Thrumylens
              website at <strong>www.saaathrumylens.co.ke</strong> (the &ldquo;Site&rdquo;). By
              accessing or using the Site, you agree to be bound by these Terms.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By using this Site, you agree to these Terms and our{" "}
              <a href="/privacy">Privacy Policy</a>. If you do not agree, please do not use the Site.
            </p>

            <h2>2. Use of the Site</h2>
            <p>You may use the Site for personal, non-commercial purposes. You agree not to:</p>
            <ul>
              <li>Copy, reproduce, or distribute our content without permission</li>
              <li>Post spam, abusive, or defamatory comments</li>
              <li>Attempt to access our admin or editor systems without authorisation</li>
              <li>Use the Site in any way that could damage, disable, or impair it</li>
              <li>Scrape or harvest data from the Site</li>
            </ul>

            <h2>3. Content Ownership</h2>
            <p>
              All content on this Site — including articles, reviews, essays, images, and design — is
              owned by Sanaa Thrumylens or its contributors and is protected by Kenyan and
              international copyright law. You may share links to our articles freely. You may quote
              brief excerpts with attribution and a link back to the original article. You may not
              republish full articles without written permission.
            </p>

            <h2>4. User-Generated Content (Comments)</h2>
            <p>
              When you comment on an article, you grant Sanaa Thrumylens a non-exclusive licence to
              display your comment on our Site. You retain ownership of your comment. You are
              responsible for the content of your comments and must not:
            </p>
            <ul>
              <li>Post content that is defamatory, hateful, or harassing</li>
              <li>Post content that infringes on someone else&apos;s intellectual property</li>
              <li>Post personal information about others without their consent</li>
              <li>Impersonate another person</li>
            </ul>
            <p>
              We reserve the right to moderate, edit, or delete any comment at our discretion. First
              comments from any user require admin approval before appearing.
            </p>

            <h2>5. Newsletter Subscription</h2>
            <p>
              Subscribing to The Weekly Dispatch is voluntary. You can unsubscribe at any time via the
              link in any email. We will not send you emails other than the newsletter and
              account-related notifications (magic links, comment notifications) unless you
              explicitly request them.
            </p>

            <h2>6. Events Listings</h2>
            <p>
              Event listings on our Site are provided for informational purposes. We are not
              responsible for the accuracy of event details (dates, venues, ticket prices) or for the
              events themselves. Always verify details with the event organiser before attending.
            </p>

            <h2>7. Advertising</h2>
            <p>
              If we display advertising on the Site, ads are clearly labelled. We are not responsible
              for the content of advertisements or the products/services they promote. Clicking on
              ads takes you to third-party sites governed by their own terms.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              Sanaa Thrumylens is provided &ldquo;as is&rdquo; without warranties of any kind. We are
              not liable for any direct, indirect, or consequential damages arising from your use of
              the Site. Opinions expressed in articles are those of the authors and do not necessarily
              reflect the views of Sanaa Thrumylens.
            </p>

            <h2>9. Editorial Independence</h2>
            <p>
              Our editorial content is independent. We do not accept paid reviews. When we cover a
              project by an artist we have a personal relationship with, we disclose it. Advertisements
              and sponsored content (if any) will be clearly labelled and will never influence our
              editorial coverage.
            </p>

            <h2>10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Site after changes
              constitutes acceptance of the updated Terms.
            </p>

            <h2>11. Govering Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be
              resolved in the courts of Kenya.
            </p>

            <h2>12. Contact</h2>
            <p>
              If you have questions about these Terms, contact us at{" "}
              <a href="mailto:hello@sanaathrumylens.co.ke">hello@sanaathrumylens.co.ke</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
