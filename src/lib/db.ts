import { PrismaClient } from '@prisma/client'

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
