import nodemailer from "nodemailer";

/**
 * Email sending utility using nodemailer + DirectAdmin SMTP.
 *
 * SMTP credentials are stored in environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * All emails include an unsubscribe link and physical address footer
 * for CAN-SPAM / GDPR compliance.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env"
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587 (STARTTLS)
    auth: { user, pass },
  });

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // plain-text fallback
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

    await transport.sendMail({
      from: `"Sanaa Thrumylens" <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? "",
      replyTo: options.replyTo ?? from,
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

/**
 * Build the standard email footer with unsubscribe link and address.
 * Included in every email for legal compliance.
 */
export function emailFooter(unsubscribeEmail: string): string {
  const baseUrl = "https://www.saaathrumylens.co.ke";
  return `
    <tr>
      <td style="padding: 32px 40px; background-color: #2A1D14; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #C4B5A0; line-height: 1.6;">
          You're receiving this email because you subscribed to The Weekly Dispatch from Sanaa Thrumylens.
        </p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #C4B5A0; line-height: 1.6;">
          <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}" style="color: #D4A574; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="${baseUrl}" style="color: #D4A574; text-decoration: underline;">Visit our website</a>
          &nbsp;·&nbsp;
          <a href="mailto:hello@sanaathrumylens.co.ke" style="color: #D4A574; text-decoration: underline;">Contact us</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #8B7355; line-height: 1.6;">
          © ${new Date().getFullYear()} Sanaa Thrumylens. All rights reserved.<br>
          Sanaa Thrumylens · Nairobi, Kenya<br>
          sanaathrumylens.co.ke
        </p>
      </td>
    </tr>
  `;
}
