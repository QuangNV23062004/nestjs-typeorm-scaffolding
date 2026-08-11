import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from './database-url';
import { registerTransactionClient } from './transaction.context';

/**
 * Single PrismaClient for the whole app.
 *
 * Prisma 7 no longer takes a connection URL from the schema — it needs a driver
 * adapter, so the pg pool is wired up here from the same env vars the CLI uses.
 *
 * Repositories are the module boundary, not this class: inject PrismaService
 * into a repository and let the repository touch only its own models.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: new PrismaPg(buildDatabaseUrl()),

      // Credential columns never leave the database layer by default. This is
      // enforced at the query, not at serialization: the fields are absent from
      // the returned object AND from its type, so a leak through GraphQL, a log
      // line, or an error_logs row is a compile error rather than an incident.
      //
      // The two call sites that genuinely need them (login, password change)
      // opt back in explicitly via `omit: { passwordHash: false }` — grep
      // "WithCredentials" to find them.
      omit: {
        account: {
          passwordHash: true,
          passwordSalt: true,
        },
      },

      log:
        process.env.DB_LOGGING === 'true'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Lets @Transactional() work on classes that compose repositories without
    // injecting PrismaService themselves. One client per process, so this is a
    // registration, not a cache.
    registerTransactionClient(this);
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
