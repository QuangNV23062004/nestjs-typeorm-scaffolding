import { trace } from '@opentelemetry/api';
import { getRequestContext } from './request.context';

/**
 * Ids of the currently-active span. Both undefined outside a span — that is
 * real information (no SDK, or code running outside a traced path), so it is
 * deliberately NOT faked with a random id: a fabricated id correlates to
 * nothing and differs on every call.
 */
export function traceIds(): { traceId?: string; spanId?: string } {
  const ctx = trace.getActiveSpan()?.spanContext();
  return ctx ? { traceId: ctx.traceId, spanId: ctx.spanId } : {};
}

/**
 * Request + trace metadata suffix shared by every log line, so decorator logs
 * and interceptor logs carry identical fields and join on `trace=`.
 * Returns '' outside a request (cron, queue, bootstrap).
 */
export function logMeta(): string {
  const { traceId, spanId } = traceIds();
  const rc = getRequestContext();
  const parts: string[] = [];

  if (rc) parts.push(`${rc.method} ${rc.url}`);
  if (rc?.accountId) parts.push(`account=${rc.accountId}`);
  if (rc?.ip) parts.push(`ip=${rc.ip}`);
  if (traceId) parts.push(`trace=${traceId}`);
  if (spanId) parts.push(`span=${spanId}`);

  return parts.join(' ');
}
