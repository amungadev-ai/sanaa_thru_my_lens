/**
 * Editor authentication utilities.
 * Separate from admin auth — editors have their own login, session, and permissions.
 */
import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const EDITOR_SESSION_COOKIE = "st_editor_session";
export const EDITOR_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const INVITE_EXPIRY_DAYS = 7;

/**
 * Generate a secure random invite token.
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if an invite token is valid (exists, not expired, not already used).
 */
export async function validateInviteToken(token: string) {
  if (!token || token.length !== 64) return null;

  const editor = await db.editor.findUnique({ where: { inviteToken: token } });
  if (!editor) return null;
  if (editor.status !== "PENDING") return null;
  if (!editor.inviteExpires || editor.inviteExpires < new Date()) return null;

  return editor;
}

/**
 * Editor login: verify credentials and set session cookie.
 */
export async function loginEditor(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const editor = await db.editor.findUnique({ where: { email: normalized } });

  if (!editor || editor.status !== "ACTIVE" || !editor.passwordHash) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, editor.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const token = Buffer.from(`${editor.id}:${Date.now()}`).toString("base64");
  const store = await cookies();
  store.set(EDITOR_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EDITOR_SESSION_MAX_AGE,
  });

  return { ok: true as const, editor };
}

/**
 * Log out editor: clear session cookie.
 */
export async function logoutEditor() {
  const store = await cookies();
  store.delete(EDITOR_SESSION_COOKIE);
}

/**
 * Get the currently logged-in editor, or null.
 */
export async function getCurrentEditor() {
  const store = await cookies();
  const session = store.get(EDITOR_SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const decoded = Buffer.from(session.value, "base64").toString("utf-8");
    const [editorId] = decoded.split(":");
    if (!editorId) return null;

    const editor = await db.editor.findUnique({ where: { id: editorId } });
    if (!editor || editor.status !== "ACTIVE") return null;

    return editor;
  } catch {
    return null;
  }
}

/**
 * Require editor auth — redirect to /editor/login if not authenticated.
 */
export async function requireEditor() {
  const editor = await getCurrentEditor();
  if (!editor) {
    const { redirect } = await import("next/navigation");
    redirect("/editor/login");
  }
  return editor!;
}
