import { emailFooter } from "./email";

/**
 * HTML email templates for Sanaa Thrumylens.
 * All templates use inline styles for email client compatibility.
 */

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
    .btn { display: inline-block; padding: 14px 32px; background-color: #A0421C; color: #FFF8EE; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid #DCCBB1; margin: 24px 0; }
    .article-card { padding: 16px; background-color: #EFE4D2; border-radius: 6px; margin: 12px 0; }
    .article-card h3 { margin: 0 0 4px 0; font-size: 16px; color: #2A1D14; }
    .article-card p { margin: 0; font-size: 14px; color: #6B5642; }
    .article-card a { color: #A0421C; text-decoration: none; }
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
 * Welcome email sent immediately when a reader subscribes.
 */
export function welcomeEmail(email: string): { subject: string; html: string; text: string } {
  const baseUrl = "https://www.saaathrumylens.co.ke";

  const content = `
    <h2 style="margin-top: 0;">Karibu, welcome to Sanaa Thrumylens! 🎉</h2>
    <p>
      Thank you for subscribing to <strong>The Weekly Dispatch</strong>. Every Friday,
      you'll receive our best new stories — long-form reviews, essays, and scene reports
      on Kenya's music, literature, culture, and the people shaping East Africa's
      creative economy.
    </p>
    <p>
      No spam. No noise. Just considered writing from Nairobi, delivered straight
      to your inbox.
    </p>

    <hr class="divider">

    <h2>Start reading</h2>
    <p>Here are three stories to get you started:</p>

    <div class="article-card">
      <h3><a href="${baseUrl}/post/ujana-ni-moshi-ndio-maana-tunavutia-kodong-klans-disko-video-review">Kodong Klan's 'Disko' Video Review</a></h3>
      <p>How the right video can elevate a song to a fulfilling musical experience.</p>
    </div>

    <div class="article-card">
      <h3><a href="${baseUrl}/post/ep-review-the-lick-back-by-nikita-kering">EP Review: The Lick Back by Nikita Kering</a></h3>
      <p>Nikita Kering's EP is a confident, polished statement from an artist in her flow state.</p>
    </div>

    <div class="article-card">
      <h3><a href="${baseUrl}/post/why-kenya-is-africas-underdog-in-the-creative-and-art-sector">Why Kenya is Africa's Underdog in Creative Arts</a></h3>
      <p>Kenya's creative sector has potential — but what's holding it back?</p>
    </div>

    <a href="${baseUrl}" class="btn">Read more on the site →</a>

    <hr class="divider">

    <p style="font-size: 14px; color: #6B5642;">
      <strong>P.S.</strong> If you ever want to stop receiving these emails, just click
      the unsubscribe link at the bottom of any email. No hard feelings — we'll be here
      if you change your mind.
    </p>
  `;

  const text = `
Karibu, welcome to Sanaa Thrumylens!

Thank you for subscribing to The Weekly Dispatch. Every Friday, you'll receive
our best new stories — long-form reviews, essays, and scene reports on Kenya's
music, literature, culture, and the people shaping East Africa's creative economy.

No spam. No noise. Just considered writing from Nairobi.

Start reading: ${baseUrl}

If you ever want to unsubscribe, visit: ${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();

  return {
    subject: "Welcome to Sanaa Thrumylens 🎉",
    html: wrap(content, email),
    text,
  };
}

/**
 * Confirmation email sent when someone re-subscribes after unsubscribing.
 */
export function resubscribedEmail(email: string): { subject: string; html: string; text: string } {
  const content = `
    <h2 style="margin-top: 0;">Welcome back! 👋</h2>
    <p>
      You've been re-subscribed to <strong>The Weekly Dispatch</strong>. We're glad
      to have you back in the community.
    </p>
    <p>
      Your first dispatch will arrive this Friday. In the meantime, catch up on
      our latest stories:
    </p>
    <a href="https://www.saaathrumylens.co.ke" class="btn">Visit the blog →</a>
  `;

  const text = `
Welcome back to Sanaa Thrumylens!

You've been re-subscribed to The Weekly Dispatch. We're glad to have you back.

Visit the blog: https://www.saaathrumylens.co.ke

To unsubscribe: https://www.saaathrumylens.co.ke/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();

  return {
    subject: "Welcome back to Sanaa Thrumylens 👋",
    html: wrap(content, email),
    text,
  };
}
