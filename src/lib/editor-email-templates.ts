import { emailFooter } from "./email";

const BASE_STYLES = `
  <style>
    body { margin: 0; padding: 0; background-color: #F7F2E9; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFDF8; }
    .header { padding: 32px 40px; background-color: #A0421C; text-align: center; border-radius: 8px 8px 0 0; }
    .logo { font-size: 28px; font-weight: 700; color: #FFF8EE; letter-spacing: -0.5px; }
    .tagline { font-size: 12px; color: #F7F2E9; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .body { padding: 40px; }
    .body p { font-size: 16px; line-height: 1.7; color: #2A1D14; margin: 0 0 16px 0; }
    .body h2 { font-size: 22px; color: #2A1D14; margin: 24px 0 12px 0; font-weight: 700; }
    .btn { display: inline-block; padding: 14px 32px; background-color: #A0421C; color: #FFF8EE !important; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid #DCCBB1; margin: 24px 0; }
    .article-card { padding: 16px; background-color: #EFE4D2; border-radius: 6px; margin: 12px 0; }
    .article-card h3 { margin: 0 0 4px 0; font-size: 16px; color: #2A1D14; }
    .article-card p { margin: 0; font-size: 14px; color: #6B5642; }
    .article-card a { color: #A0421C; text-decoration: none; }
    .cover-img { width: 100%; max-width: 520px; border-radius: 6px; margin: 16px 0; display: block; }
    .invite-box { padding: 24px; background-color: #EFE4D2; border-radius: 6px; margin: 16px 0; text-align: center; }
    .invite-box h2 { margin: 0 0 8px 0; }
  </style>
`;

function wrap(content: string, unsubscribeEmail: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${BASE_STYLES}
</head>
<body>
  <table class="wrapper" cellpadding="0" cellspacing="0" width="600">
    <tr>
      <td class="header">
        <div class="logo">Sanaa Thrumylens</div>
        <div class="tagline">Art Through My Lens</div>
      </td>
    </tr>
    <tr>
      <td class="body">
        ${content}
      </td>
    </tr>
    ${emailFooter(unsubscribeEmail)}
  </table>
</body>
</html>
  `.trim();
}

/**
 * Editor invite email — sent by admin when onboarding a new editor.
 * Contains a link to set their password.
 */
export function editorInviteEmail(
  editorEmail: string,
  editorName: string | null,
  inviteToken: string
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saaathrumylens.co.ke";
  const inviteUrl = `${baseUrl}/editor/invite/${inviteToken}`;
  const name = editorName ?? "there";

  const content = `
    <h2 style="margin-top: 0;">You're invited to join Sanaa Thrumylens ✍️</h2>
    <p>
      Hi ${name},
    </p>
    <p>
      You've been invited to join the <strong>Sanaa Thrumylens</strong> editorial team as a
      contributor. As an editor, you'll be able to write and publish stories on Kenya's
      creative arts scene — music reviews, literature, culture, and more.
    </p>
    <p>
      To get started, click the button below to set your password and activate your account:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${inviteUrl}" class="btn">Set my password →</a>
    </div>

    <p style="font-size: 14px; color: #6B5642;">
      <strong>This invite link expires in 7 days.</strong> If you didn't expect this
      invitation, you can safely ignore this email.
    </p>

    <hr class="divider">

    <p style="font-size: 14px; color: #6B5642;">
      Need help? Reply to this email or contact us at
      <a href="mailto:hello@sanaathrumylens.co.ke" style="color: #A0421C;">hello@sanaathrumylens.co.ke</a>.
    </p>
  `;

  const text = `
You're invited to join Sanaa Thrumylens!

Hi ${name},

You've been invited to join the Sanaa Thrumylens editorial team as a contributor.
As an editor, you'll be able to write and publish stories on Kenya's creative arts scene.

To get started, set your password here: ${inviteUrl}

This invite link expires in 7 days. If you didn't expect this invitation, you can
safely ignore this email.

Need help? Contact hello@sanaathrumylens.co.ke
  `.trim();

  return {
    subject: "You're invited to write for Sanaa Thrumylens ✍️",
    html: wrap(content, editorEmail),
    text,
  };
}

/**
 * New article notification — sent to all active subscribers when a post is published.
 */
export function newArticleEmail(
  subscriberEmail: string,
  post: { title: string; slug: string; excerpt: string; coverImage: string | null; category: string | null; author: string }
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saaathrumylens.co.ke";
  const articleUrl = `${baseUrl}/post/${post.slug}`;

  const coverHtml = post.coverImage
    ? `<img src="${post.coverImage}" alt="${post.title}" class="cover-img">`
    : "";

  const content = `
    <h2 style="margin-top: 0;">New on Sanaa Thrumylens 📖</h2>
    <p>
      A new story just dropped${post.category ? ` in <strong>${post.category}</strong>` : ""}.
      Here's what's waiting for you:
    </p>

    ${coverHtml}

    <div class="article-card" style="background-color: #FFF; border: 1px solid #DCCBB1; padding: 20px;">
      <h3 style="font-size: 20px; margin: 0 0 8px 0;"><a href="${articleUrl}" style="color: #2A1D14; text-decoration: none;">${post.title}</a></h3>
      <p style="font-size: 15px; color: #6B5642; line-height: 1.6; margin: 0 0 12px 0;">${post.excerpt}</p>
      <p style="font-size: 13px; color: #8B7355; margin: 0;">By ${post.author}</p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${articleUrl}" class="btn">Read the full story →</a>
    </div>

    <hr class="divider">

    <p style="font-size: 14px; color: #6B5642;">
      You're receiving this because you subscribed to The Weekly Dispatch. We only email
      when we publish something worth your time.
    </p>
  `;

  const text = `
New on Sanaa Thrumylens

${post.title}
By ${post.author}

${post.excerpt}

Read the full story: ${articleUrl}

---
You're receiving this because you subscribed to The Weekly Dispatch.
To unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}
  `.trim();

  return {
    subject: `New: ${post.title}`,
    html: wrap(content, subscriberEmail),
    text,
  };
}
