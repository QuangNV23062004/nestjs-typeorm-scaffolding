import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ErrorLogRepository } from 'src/modules/error-logs/error-logs.repository';
import { traceIds } from '../common/context/tracing.context';
import {
  getRequest,
  getResponse,
  isGraphQL,
} from '../common/context/execution-context.util';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly errorLogRepository: ErrorLogRepository,
    private readonly logStatuses: number[] = [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
      HttpStatus.INTERNAL_SERVER_ERROR,
    ], // e.g., [400, 500]
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const graphql = isGraphQL(context);
    const request = getRequest(context);
    const response = getResponse(context);

    return next.handle().pipe(
      tap({
        next: () => {
          // GraphQL answers 200 for everything, so a status-based audit rule is
          // meaningless there — the success branch is HTTP-only.
          if (graphql || !response) return;

          // Log successful responses if status is in logStatuses (e.g., for audits)
          if (this.logStatuses.includes(response.statusCode)) {
            this.errorLogRepository.saveLog(
              response.statusCode,
              request?.method as string,
              request?.url as string,
              request?.query as Record<string, any>,
              request?.params as Record<string, any>,
              request?.body as Record<string, any>,
              (request as any)?.accountInfo,
              (response as any).message || '',
              traceIds().traceId,
            );
          }
        },
        error: (error) => {
          // Log errors if status is in logStatuses
          const status = error.status || 500;
          if (!graphql && !this.logStatuses.includes(status)) return;

          this.errorLogRepository.saveLog(
            status,
            graphql ? 'GRAPHQL' : (request?.method as string),
            // Record which resolver failed; every GraphQL call shares one URL.
            graphql
              ? `${request?.url ?? '/graphql'}#${context.getHandler().name}`
              : (request?.url as string),
            request?.query as Record<string, any>,
            request?.params as Record<string, any>,
            request?.body as Record<string, any>,
            (request as any)?.accountInfo,
            error.message,
            traceIds().traceId,
          );
        },
      }),
    );
  }
}
