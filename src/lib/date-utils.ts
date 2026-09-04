/**
 * Safe date formatting utilities.
 *
 * unstable_cache serializes data to JSON, which converts Date objects to
 * ISO strings. When cached data is read back, date fields are strings,
 * not Date objects — so calling .toLocaleDateString() on them throws.
 *
 * These helpers handle both Date and string inputs safely.
 */

/**
 * Format a date (Date object OR ISO string) for display.
 * Returns "12 Aug 2026" style.
 */
export function formatDateSafe(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a date (Date object OR ISO string) for long display.
 * Returns "12 August 2026" style.
 */
export function formatDateLongSafe(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Convert any date-like value to an ISO string.
 * Handles both Date objects and ISO strings (from unstable_cache).
 */
export function toISOStringSafe(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return new Date(0).toISOString();
  return date.toISOString();
}
