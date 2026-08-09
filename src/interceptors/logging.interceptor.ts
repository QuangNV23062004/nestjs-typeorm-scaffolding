import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logMeta } from '../common/context/tracing.context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    // method/url/ip/userAgent come from logMeta() via the request context store,
    // so these lines carry the same fields as @Tracing() logs and join on trace=.
    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = context.switchToHttp().getResponse();
          this.logger.log(
            `${statusCode} ${Date.now() - startTime}ms ${logMeta()}`,
          );
        },
        error: (error) => {
          this.logger.error(
            `${error.status || 500} ${Date.now() - startTime}ms ${logMeta()} - ${error.message}`,
          );
        },
      }),
    );
  }
}
