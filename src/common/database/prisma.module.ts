import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global because there is exactly one PrismaClient per process — unlike
 * TypeOrmModule.forFeature([...]), Prisma has no per-model scoping to declare.
 * Module isolation is enforced by each module's repository, not by DI wiring.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
