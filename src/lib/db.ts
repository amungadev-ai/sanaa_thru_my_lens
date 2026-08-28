import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Vercel/serverless, each function instance creates its own PrismaClient.
// Shared MySQL hosting (DirectAdmin) limits max_user_connections, so we:
// 1. Use a global singleton to reuse the client across warm invocations
// 2. Rely on connection_limit=1 in the DATABASE_URL query string
// 3. Enable the global singleton in production too (not just dev)
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

// Always cache the client — even in production, so warm serverless functions
// reuse the same connection instead of opening new ones.
globalForPrisma.prisma = db

/**
 * Check if a Prisma error is a connection-limit error (P2037).
 * These are retryable — waiting briefly and retrying often succeeds.
 */
function isConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2037' // Too many connections
  }
  const msg = error instanceof Error ? error.message : String(error)
  return msg.includes('max_user_connections') || msg.includes('Too many database connections')
}

/**
 * Retry wrapper for Prisma queries.
 * If a query fails with a connection error, waits and retries up to 2 times.
 * This handles burst traffic on Vercel where multiple serverless instances
 * briefly exceed the shared hosting connection limit.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries && isConnectionError(error)) {
        // Wait before retrying (exponential backoff)
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  throw lastError
}
