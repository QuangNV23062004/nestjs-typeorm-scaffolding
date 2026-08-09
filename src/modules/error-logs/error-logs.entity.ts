import { BaseEntity } from 'src/common/entity/base.entity';

/** Mirrors the ErrorLog model in error-logs.prisma. */
export class ErrorLogsEntity extends BaseEntity {
  statusCode: number | null;
  method: string | null;
  url: string | null;
  params: Record<string, any> | null;
  query: Record<string, any> | null;
  body: Record<string, any> | null;
  accountInfo: Record<string, any> | null;
  message: string | null;
  /** W3C trace id (32 hex). Joins this row to its trace and to the app logs. */
  traceId: string | null;
}
