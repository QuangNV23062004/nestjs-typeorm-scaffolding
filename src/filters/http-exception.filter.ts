import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import {
  getRequest,
  getResponse,
  isGraphQL,
} from '../common/context/execution-context.util';

export interface ApiErrorResponse {
  success: boolean;
  error: {
    statusCode: number;
    message: string | string[];
    error?: string;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter, GqlExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message;
        error = res.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // GraphQL owns its { data, errors } envelope and there is no response to
    // write to. Returning the exception hands it to Apollo to format; writing
    // a REST-shaped body here would corrupt the response.
    if (isGraphQL(host)) {
      return exception instanceof HttpException
        ? exception
        : new HttpException({ statusCode, message, error }, statusCode);
    }

    const response = getResponse(host);
    if (!response) return exception;

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        statusCode,
        message,
        ...(error && { error }),
      },
      timestamp: new Date().toISOString(),
      path: getRequest(host)?.url ?? '',
    };

    response.status(statusCode).json(errorResponse);
  }
}
