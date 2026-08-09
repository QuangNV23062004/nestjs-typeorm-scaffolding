import { Logger } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { logMeta } from '../common/context/tracing.context';

const tracer = trace.getTracer('app');

/** Marks an error as already logged, so a throw through N decorated frames logs once. */
const LOGGED = Symbol('tracing:logged');

type SuccessLevel = 'log' | 'debug' | 'verbose';

export interface TracingOptions {
  /** Span name. Defaults to `<ClassName>.<methodName>`. */
  name?: string;
  /** Level for the success line, or false to emit span only. Defaults to 'debug'. */
  onSuccess?: SuccessLevel | false;
}

/**
 * Wraps an async method in an OTel span and logs its outcome.
 *
 * Success -> one line at `onSuccess` level with duration + trace metadata.
 * Failure -> exception recorded on the span at every frame, but logged only at
 *            the frame where it originated (deepest stack, most useful).
 *
 * Only decorate async methods: the wrapper always returns a Promise.
 * Do not decorate controllers — instrumentation-nestjs-core already spans them.
 */
export function Tracing(
  options: TracingOptions | string = {},
): MethodDecorator {
  const opts = typeof options === 'string' ? { name: options } : options;
  const successLevel = opts.onSuccess === undefined ? 'debug' : opts.onSuccess;

  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const method = String(propertyKey);
    const spanName = opts.name ?? `${className}.${method}`;
    const logger = new Logger(className);

    descriptor.value = function (...args: unknown[]) {
      return tracer.startActiveSpan(spanName, async (span) => {
        const start = Date.now();
        try {
          const result = await original.apply(this, args);
          if (successLevel) {
            logger[successLevel](
              `${method} ok ${Date.now() - start}ms ${logMeta()}`,
            );
          }
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });

          const tagged = error as Error & { [LOGGED]?: true };
          if (!tagged[LOGGED]) {
            // non-enumerable so it never leaks into JSON responses or error_logs rows
            Object.defineProperty(error, LOGGED, {
              value: true,
              enumerable: false,
            });
            logger.error(
              `${method} failed ${Date.now() - start}ms ${logMeta()} - ${error.message}`,
              error.stack,
            );
          }
          throw err;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}
