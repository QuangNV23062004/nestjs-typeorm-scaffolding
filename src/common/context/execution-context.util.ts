import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { IAuthenticatedRequest } from 'src/interfaces/request';

/**
 * Transport helpers for globally-registered guards, interceptors and filters.
 *
 * Anything registered via APP_GUARD / APP_INTERCEPTOR / APP_FILTER wraps every
 * transport the app serves. This project is REST-only today, but the moment
 * @nestjs/graphql is added those same providers also wrap resolvers — and
 * switchToHttp() returns undefined there, because GraphQL's arguments are
 * (root, args, context, info), not (req, res). The caller then throws on
 * `request.url`, and every GraphQL operation fails with an error pointing at
 * the filter rather than the real cause.
 *
 * Deliberately implemented without importing @nestjs/graphql: getType() and
 * getArgByIndex() are core Nest, so this stays dependency-free and starts
 * working the day GraphQL is introduced, with no edits here.
 */

/** True when this invocation came through a GraphQL resolver. */
export function isGraphQL(host: ArgumentsHost | ExecutionContext): boolean {
  return host.getType<string>() === 'graphql';
}

/**
 * The underlying Express request for either transport.
 *
 * GraphQL is still served over HTTP, so a request exists — it lives on the
 * GraphQL context (argument index 2) rather than in the HTTP argument slot.
 */
export function getRequest(
  host: ArgumentsHost | ExecutionContext,
): IAuthenticatedRequest | undefined {
  if (isGraphQL(host)) {
    return host.getArgByIndex<{ req?: IAuthenticatedRequest } | undefined>(2)
      ?.req;
  }
  return host.switchToHttp().getRequest<IAuthenticatedRequest>();
}

/**
 * The Express response, or undefined under GraphQL.
 *
 * Deliberately undefined for GraphQL: a resolver must not write the response
 * itself. Apollo owns the { data, errors } envelope and the status code.
 */
export function getResponse(
  host: ArgumentsHost | ExecutionContext,
): Response | undefined {
  if (isGraphQL(host)) return undefined;
  return host.switchToHttp().getResponse<Response>();
}
