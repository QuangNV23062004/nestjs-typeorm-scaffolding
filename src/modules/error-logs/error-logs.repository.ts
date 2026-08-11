import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/database/base.repository';
import { Repository } from 'typeorm';
import { omit } from 'lodash';
import * as zlib from 'zlib';
import { ErrorLogsEntity } from './error-logs.entity';

@Injectable()
export class ErrorLogRepository extends BaseRepository<ErrorLogsEntity> {
  // Redeclared so Nest emits design:paramtypes on the concrete class, and so
  // @InjectRepository can name this subclass's entity.
  constructor(
    @InjectRepository(ErrorLogsEntity)
    errorLogRepository: Repository<ErrorLogsEntity>,
  ) {
    super(errorLogRepository);
  }

  async saveLog(
    statusCode: number,
    method: string,
    url: string,
    query: Record<string, any>,
    params: Record<string, any>,
    body: Record<string, any>,
    accountInfo: Record<string, any>,
    message: string,
    traceId?: string,
  ): Promise<void> {
    const omitedBody = omit(body, ['passwordHash', 'password', 'token']);
    const log = await this.repository.create({
      statusCode,
      method,
      url,
      query,
      params,
      body: omitedBody,
      accountInfo,
      message,
      traceId: traceId ?? null,
    });

    // Save asynchronously without awaiting to avoid blocking
    this.repository
      .save(log)
      .catch((err) => console.error('Failed to save error log:', err));
  }
}
