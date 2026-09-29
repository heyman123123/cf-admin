import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/db/src/schema.ts',
  out: './apps/api/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    databaseId: process.env.CF_D1_DB_ID ?? '',
    token: process.env.CF_API_TOKEN ?? '',
    accountId: process.env.CF_ACCOUNT_ID ?? '',
  },
} satisfies Config;
