/**
 * Subscriber notification service.
 * Sends an email to all active subscribers when a new article is published.
 *
 * To avoid overwhelming the SMTP server, emails are sent in small batches
 * with short delays between each batch.
 */
import { db } from "./db";
import { sendEmail } from "./email";
import { newArticleEmail } from "./editor-email-templates";

const BATCH_SIZE = 25; // emails per batch
const BATCH_DELAY_MS = 2000; // 2 seconds between batches

interface PostForNotification {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string | null;
  author: string;
}

/**
 * Send a "new article" email to all active subscribers.
 * Called when a post is published for the first time.
 *
 * Non-blocking — callers should NOT await this. It runs in the background.
 */
export async function notifySubscribersOfNewPost(post: PostForNotification): Promise<void> {
  try {
    // Mark as notified immediately to prevent duplicate sends
    await db.post.update({
      where: { id: post.id },
      data: { notified: true },
    });

    const subscribers = await db.subscriber.findMany({
      where: { status: "ACTIVE" },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });

    if (subscribers.length === 0) {
      console.log(`[notify] No active subscribers — skipping for "${post.title}"`);
      return;
    }

    console.log(`[notify] Sending "${post.title}" to ${subscribers.length} subscribers...`);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      // Send each email in the batch
      await Promise.all(
        batch.map(async (sub) => {
          const emailContent = newArticleEmail(sub.email, post);
          const ok = await sendEmail({
            to: sub.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });
          if (ok) sent++;
          else failed++;
        })
      );

      // Delay between batches (except after the last one)
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    console.log(
      `[notify] Done: ${sent} sent, ${failed} failed out of ${subscribers.length} subscribers`
    );
  } catch (error) {
    console.error("[notify] Failed to send subscriber notifications:", error);
  }
}
