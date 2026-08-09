import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { requestContextStorage } from './request.context';

/**
 * Opens an AsyncLocalStorage scope for the lifetime of each request, so any
 * code downstream (guards, services, repositories) can read request metadata
 * via getRequestContext() without it being threaded through call signatures.
 *
 * Runs as middleware — before guards, interceptors and pipes — so the store is
 * populated for the entire chain.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    requestContextStorage.run(
      {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        startedAt: Date.now(),
      },
      () => next(),
    );
  }
}
