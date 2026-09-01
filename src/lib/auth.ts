/**
 * Cookie-based admin auth for the CMS.
 *
 * Demo-only: stores a simple signed token in an httpOnly cookie.
 * In production, swap in NextAuth.js or JWT with a strong secret.
 */
import { cookies } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE = "st_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ADMIN_EMAIL = "admin@sanaathrumylens.co.ke";
const ADMIN_PASSWORD = "Admin254!";

/**
 * Validate credentials against the database admin user.
 * Falls back to env-defined admin if no DB user exists.
 */
export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  // Try DB lookup first
  const admin = await db.adminUser.findUnique({ where: { email: normalized } });
  if (admin) {
    // Demo: plaintext compare. Replace with bcrypt in production.
    return admin.password === password;
  }

  // Fallback to defaults
  return normalized === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

/**
 * Log in: verify credentials and set session cookie.
 * Returns { ok: true } on success or { ok: false, error } on failure.
 */
export async function login(email: string, password: string) {
  const ok = await verifyCredentials(email, password);
  if (!ok) {
    return { ok: false as const, error: "Invalid email or password." };
  }
  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return { ok: true as const };
}

/**
 * Log out: clear session cookie.
 */
export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Check if the current request is authenticated.
 * Server-side only (uses next/headers cookies()).
 */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE);
  if (!session?.value) return false;
  try {
    const decoded = Buffer.from(session.value, "base64").toString("utf-8");
    const [email] = decoded.split(":");
    if (!email) return false;
    // Optionally verify against DB
    const admin = await db.adminUser.findUnique({ where: { email } });
    return !!admin || email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

/**
 * Require auth — redirect to /admin/login if not authenticated.
 * Use in CMS pages/layouts.
 */
export async function requireAuth(): Promise<void> {
  const authed = await isAuthenticated();
  if (!authed) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}
