import { PrismaClient } from '@prisma/client';

// Helper function to add pgbouncer parameter for Supabase pooler connections
const getDatabaseUrl = (): string | undefined => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If using Supabase pooler, add pgbouncer=true to avoid prepared statement errors
  if (url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    console.log('[Prisma] Adding pgbouncer=true for Supabase pooler connection');
    return `${url}${separator}pgbouncer=true`;
  }
  return url;
};

// Singleton Prisma Client with pgBouncer compatibility
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
