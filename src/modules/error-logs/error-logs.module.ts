import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogsEntity } from './error-logs.entity';
import { ErrorLogRepository } from './error-logs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorLogsEntity])],
  providers: [ErrorLogRepository],
  exports: [ErrorLogRepository],
})
export class ErrorLogsModule {}
