/**
 * One-line-per-span console exporter for local dev.
 *
 * OTel's stock ConsoleSpanExporter prints the whole ReadableSpan, which repeats
 * the ~12 host/process resource attributes on every span and dumps entire
 * GraphQL documents into `graphql.source`. One POST /graphql runs to hundreds
 * of lines.
 *
 * This goes through Nest's Logger instead of console.log, so span lines carry
 * the same timestamp/level/context prefix as the rest of the app and stay
 * greppable alongside them. The span's own attributes are printed as JSON meta,
 * mirroring the `trace=`/`span=` suffix that logMeta() adds elsewhere.
 *
 *   [Nest] 74175  - 08/11/2026, 10:27:03 AM   LOG [Trace] POST /graphql
 *     {"durationMs":15.85,"http.response.status_code":200,"traceId":"ae836330"}
 *
 * Dev only — the OTLP path in tracing.ts exports full spans to the collector,
 * which is where the dropped detail actually belongs.
 */
import { Logger } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import {
  ExportResultCode,
  hrTimeToMilliseconds,
  type ExportResult,
} from '@opentelemetry/core';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-node';

/**
 * Apollo Sandbox re-runs IntrospectionQuery on every tab focus and schema poll.
 * It is never the thing you opened the console to look at.
 */
const IGNORED_SPAN_NAMES = new Set(['query IntrospectionQuery']);

/**
 * Attributes too large for a one-line log. They stay on the span, so the OTLP
 * path still ships them.
 */
const OVERSIZED_ATTRS = new Set(['graphql.source']);

export class CompactConsoleSpanExporter implements SpanExporter {
  private readonly logger = new Logger('Trace');

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const span of spans) {
      if (IGNORED_SPAN_NAMES.has(span.name)) continue;

      const { traceId, spanId } = span.spanContext();
      const meta: Record<string, unknown> = {
        durationMs: Number(hrTimeToMilliseconds(span.duration).toFixed(2)),
        traceId,
        spanId,
      };
      for (const [key, value] of Object.entries(span.attributes)) {
        if (!OVERSIZED_ATTRS.has(key)) meta[key] = value;
      }

      // Sorted so the same fields land in the same order on every line, which
      // is what makes these greppable and diffable across requests.
      const json = JSON.stringify(
        meta,
        Object.keys(meta).sort((a, b) => a.localeCompare(b)),
      );

      if (span.status.code === SpanStatusCode.ERROR) {
        this.logger.error(
          `${span.name}${span.status.message ? ` - ${span.status.message}` : ''} ${json}`,
        );
      } else {
        this.logger.log(`${span.name} ${json}`);
      }
    }

    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  async shutdown(): Promise<void> {}

  async forceFlush(): Promise<void> {}
}
