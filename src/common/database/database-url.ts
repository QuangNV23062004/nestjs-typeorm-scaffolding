/**
 * Builds the Postgres connection URL from the same discrete env vars the rest
 * of the app uses (DB_HOST, DB_PORT, ...), so there is one source of truth.
 *
 * Shared by prisma.config.ts (CLI: migrate, generate, studio) and PrismaService
 * (runtime adapter). DATABASE_URL, if set, wins — hosted Postgres providers
 * hand you a single URL and nothing else.
 *
 * Kept free of NestJS imports on purpose: prisma.config.ts is loaded by the
 * Prisma CLI, outside the Nest DI container.
 */
export function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 5432;
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const database = process.env.DB_NAME || 'data_labeling_db';
  const ssl = process.env.DB_SSL === 'true';

  // Credentials may contain characters that are not URL-safe.
  const auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
  const query = ssl ? '?sslmode=require' : '';

  return `postgresql://${auth}@${host}:${port}/${database}${query}`;
}
