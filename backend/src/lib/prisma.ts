import { PrismaClient } from '@prisma/client';

// Helper function to add connection parameters for production
const getDatabaseUrl = (): string | undefined => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  let finalUrl = url;

  // If using Supabase pooler, add pgbouncer=true to avoid prepared statement errors
  if (finalUrl.includes('pooler.supabase.com') && !finalUrl.includes('pgbouncer=true')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    console.log('[Prisma] Adding pgbouncer=true for Supabase pooler connection');
    finalUrl = `${finalUrl}${separator}pgbouncer=true`;
  }

  // Railway 환경: 커넥션 풀 최적화 (기본 5 → 15, 타임아웃 30초)
  if (!finalUrl.includes('connection_limit')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}connection_limit=15&pool_timeout=30`;
    console.log('[Prisma] Connection pool: limit=15, timeout=30s');
  }

  return finalUrl;
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
