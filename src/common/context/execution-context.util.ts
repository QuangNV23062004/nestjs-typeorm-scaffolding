import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { IAuthenticatedRequest } from 'src/interfaces/request';

/**
 * Transport helpers for globally-registered guards, interceptors and filters.
 *
 * Anything registered via APP_GUARD / APP_INTERCEPTOR / APP_FILTER wraps BOTH
 * REST routes and GraphQL resolvers. Calling switchToHttp() on a GraphQL
 * request returns undefined — GraphQL's arguments are
 * (root, args, context, info), not (req, res) — so the caller then throws on
 * `request.url` and every resolver fails for an unrelated-looking reason.
 */

/** True when this invocation came through the GraphQL endpoint. */
export function isGraphQL(host: ArgumentsHost | ExecutionContext): boolean {
  return host.getType<GqlContextType>() === 'graphql';
}

/**
 * The underlying Express request for either transport.
 *
 * GraphQL is still served over HTTP, so a request object exists — it just
 * lives on the GraphQL context rather than in the HTTP argument slot.
 * Returns undefined for transports that have neither (e.g. microservices).
 */
export function getRequest(
  host: ArgumentsHost | ExecutionContext,
): IAuthenticatedRequest | undefined {
  if (isGraphQL(host)) {
    return GqlArgumentsHost.create(host).getContext<{
      req?: IAuthenticatedRequest;
    }>()?.req;
  }
  return host.switchToHttp().getRequest<IAuthenticatedRequest>();
}

/**
 * The Express response, or undefined under GraphQL.
 *
 * Deliberately undefined for GraphQL: a resolver must not write to the
 * response itself. Apollo owns the { data, errors } envelope and status code.
 */
export function getResponse(
  host: ArgumentsHost | ExecutionContext,
): Response | undefined {
  if (isGraphQL(host)) return undefined;
  return host.switchToHttp().getResponse<Response>();
}
