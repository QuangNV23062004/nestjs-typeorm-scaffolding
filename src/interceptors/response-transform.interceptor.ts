import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  getRequest,
  isGraphQL,
} from '../common/context/execution-context.util';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    // GraphQL defines its own { data, errors } envelope. Wrapping a resolver's
    // return value here would nest this shape inside it and break every client
    // and the generated schema's contract.
    if (isGraphQL(context)) {
      return next.handle();
    }

    const path = getRequest(context)?.url ?? '';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path,
      })),
    );
  }
}
