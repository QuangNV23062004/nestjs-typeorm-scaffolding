import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma';
import { buildDatabaseUrl } from './database-url';

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
      log:
        process.env.DB_LOGGING === 'true'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
