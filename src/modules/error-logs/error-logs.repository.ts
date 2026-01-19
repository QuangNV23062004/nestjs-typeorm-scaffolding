import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { omit } from 'lodash';
import * as zlib from 'zlib';
import { ErrorLogsEntity } from './error-logs.entity';

@Injectable()
export class ErrorLogRepository {
  constructor(
    @InjectRepository(ErrorLogsEntity)
    private readonly errorLogRepository: Repository<ErrorLogsEntity>,
  ) {}

  async saveLog(
    statusCode: number,
    method: string,
    url: string,
    query: Record<string, any>,
    params: Record<string, any>,
    body: Record<string, any>,
    accountInfo: Record<string, any>,
    message: string,
  ): Promise<void> {
    const omitedBody = omit(body, ['passwordHash', 'password', 'token']);
    const log = await this.errorLogRepository.create({
      statusCode,
      method,
      url,
      query,
      params,
      body: omitedBody,
      accountInfo,
      message,
    });

    // Save asynchronously without awaiting to avoid blocking
    this.errorLogRepository
      .save(log)
      .catch((err) => console.error('Failed to save error log:', err));
  }
}
