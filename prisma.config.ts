import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { buildDatabaseUrl } from './src/common/database/database-url';

export default defineConfig({
  // Models live beside the NestJS module that owns them. Prisma reads every
  // *.prisma under this directory recursively and ignores .ts files.
  schema: 'src/modules',

  // Keep migrations out of src/ — they are not application code.
  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: buildDatabaseUrl(),
  },
});
