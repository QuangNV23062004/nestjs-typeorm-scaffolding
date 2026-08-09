import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';
import { PrismaService } from 'src/common/database/prisma.service';
import { Prisma } from 'src/generated/prisma';

@Injectable()
export class ErrorLogRepository {
  constructor(private readonly prisma: PrismaService) {}

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

    // Save asynchronously without awaiting to avoid blocking
    this.prisma.errorLog
      .create({
        data: {
          statusCode,
          method,
          url,
          query: (query ?? {}) as Prisma.InputJsonValue,
          params: (params ?? {}) as Prisma.InputJsonValue,
          body: (omitedBody ?? {}) as Prisma.InputJsonValue,
          accountInfo: (accountInfo ?? {}) as Prisma.InputJsonValue,
          message,
          traceId: traceId ?? null,
        },
      })
      .catch((err) => console.error('Failed to save error log:', err));
  }
}
