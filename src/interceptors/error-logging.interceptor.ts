import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ErrorLogRepository } from 'src/modules/error-logs/error-logs.repository';

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
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap({
        next: () => {
          // Log successful responses if status is in logStatuses (e.g., for audits)
          if (this.logStatuses.includes(response.statusCode)) {
            this.errorLogRepository.saveLog(
              response.statusCode,
              request.method,
              request.url,
              request.query,
              request.params,
              request.body,
              request.accountInfo,
              response.message || '',
            );
          }
        },
        error: (error) => {
          // Log errors if status is in logStatuses
          const status = error.status || 500;
          if (this.logStatuses.includes(status)) {
            this.errorLogRepository.saveLog(
              status,
              request.method,
              request.url,
              request.query,
              request.params,
              request.body,
              error.message,
              request.accountInfo,
            );
          }
        },
      }),
    );
  }
}
