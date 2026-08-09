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
import {
  getResponse,
  isGraphQL,
} from '../common/context/execution-context.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const graphql = isGraphQL(context);

    // method/url/ip/userAgent come from logMeta() via the request context store,
    // so these lines carry the same fields as @Tracing() logs and join on trace=.
    return next.handle().pipe(
      tap({
        next: () => {
          // There is no response object under GraphQL — label by operation.
          const status = graphql
            ? `GQL ${context.getHandler().name}`
            : (getResponse(context)?.statusCode ?? '-');
          this.logger.log(`${status} ${Date.now() - startTime}ms ${logMeta()}`);
        },
        error: (error) => {
          const status = graphql
            ? `GQL ${context.getHandler().name}`
            : (error.status || 500);
          this.logger.error(
            `${status} ${Date.now() - startTime}ms ${logMeta()} - ${error.message}`,
          );
        },
      }),
    );
  }
}
