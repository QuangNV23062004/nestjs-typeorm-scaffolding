import { Module } from '@nestjs/common';
import { ErrorLogRepository } from './error-logs.repository';

@Module({
  providers: [ErrorLogRepository],
  exports: [ErrorLogRepository],
})
export class ErrorLogsModule {}
