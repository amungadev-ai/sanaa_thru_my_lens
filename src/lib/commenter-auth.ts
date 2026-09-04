/**
 * Reader authentication for commenting.
 * Hybrid: magic link by default, optional password.
 *
 * Readers can also be Subscribers (same email) — we check both tables.
 * A Subscriber can comment via magic link without a separate Reader account.
 */
import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const READER_SESSION_COOKIE = "st_reader_session";
export const READER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (readers stay logged in longer)
export const MAGIC_LINK_EXPIRY_HOURS = 1;

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Find a commenter by email — checks Reader table first, then Subscriber.
 * Returns { type, id, name, email, firstCommentApproved } or null.
 */
export async function findCommenterByEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  const reader = await db.reader.findUnique({ where: { email: normalized } });
  if (reader) {
    return {
      type: "READER" as const,
      id: reader.id,
      name: reader.name,
      email: reader.email,
      firstCommentApproved: reader.firstCommentApproved,
      status: reader.status,
    };
  }

  const subscriber = await db.subscriber.findUnique({ where: { email: normalized } });
  if (subscriber && subscriber.status === "ACTIVE") {
    return {
      type: "SUBSCRIBER" as const,
      id: subscriber.id,
      name: subscriber.name ?? subscriber.email.split("@")[0],
      email: subscriber.email,
      firstCommentApproved: false, // subscribers don't have this flag
      status: "ACTIVE" as const,
    };
  }

  return null;
}

/**
 * Generate a magic link token for a reader or subscriber.
 * Creates a Reader record if the email is only a subscriber (so we have somewhere to store the token).
 */
export async function createMagicLink(email: string): Promise<{ token: string; isExisting: boolean }> {
  const normalized = email.trim().toLowerCase();
  const token = generateMagicLinkToken();
  const expiry = new Date(Date.now() + MAGIC_LINK_EXPIRY_HOURS * 3600_000);

  let reader = await db.reader.findUnique({ where: { email: normalized } });

  if (!reader) {
    // Check if subscriber — if so, create a Reader linked to same email
    const subscriber = await db.subscriber.findUnique({ where: { email: normalized } });
    const name = subscriber?.name ?? normalized.split("@")[0];
    reader = await db.reader.create({
      data: {
        email: normalized,
        name,
        magicLinkToken: token,
        magicLinkExpiry: expiry,
      },
    });
    return { token, isExisting: false };
  }

  await db.reader.update({
    where: { id: reader.id },
    data: { magicLinkToken: token, magicLinkExpiry: expiry },
  });

  return { token, isExisting: true };
}

/**
 * Verify a magic link token and log the reader in.
 */
export async function verifyMagicLink(token: string) {
  if (!token || token.length !== 64) return null;

  const reader = await db.reader.findUnique({ where: { magicLinkToken: token } });
  if (!reader) return null;
  if (!reader.magicLinkExpiry || reader.magicLinkExpiry < new Date()) return null;

  // Clear the token (single-use)
  await db.reader.update({
    where: { id: reader.id },
    data: { magicLinkToken: null, magicLinkExpiry: null },
  });

  // Set session
  const sessionToken = Buffer.from(`${reader.id}:${Date.now()}`).toString("base64");
  const store = await cookies();
  store.set(READER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: READER_SESSION_MAX_AGE,
  });

  return reader;
}

/**
 * Login reader with email + password (optional hybrid path).
 */
export async function loginReaderWithPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const reader = await db.reader.findUnique({ where: { email: normalized } });

  if (!reader || !reader.passwordHash || reader.status !== "ACTIVE") {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, reader.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const sessionToken = Buffer.from(`${reader.id}:${Date.now()}`).toString("base64");
  const store = await cookies();
  store.set(READER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: READER_SESSION_MAX_AGE,
  });

  return { ok: true as const, reader };
}

/**
 * Get the current logged-in commenter (Reader or Subscriber).
 */
export async function getCurrentCommenter() {
  const store = await cookies();
  const session = store.get(READER_SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const decoded = Buffer.from(session.value, "base64").toString("utf-8");
    const [readerId] = decoded.split(":");
    if (!readerId) return null;

    const reader = await db.reader.findUnique({ where: { id: readerId } });
    if (!reader || reader.status !== "ACTIVE") return null;

    return {
      type: "READER" as const,
      id: reader.id,
      name: reader.name,
      email: reader.email,
      firstCommentApproved: reader.firstCommentApproved,
    };
  } catch {
    return null;
  }
}

/**
 * Log out commenter.
 */
export async function logoutCommenter() {
  const store = await cookies();
  store.delete(READER_SESSION_COOKIE);
}
