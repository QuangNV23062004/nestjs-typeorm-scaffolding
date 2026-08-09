/**
 * OpenTelemetry SDK bootstrap.
 *
 * MUST be imported before anything else in main.ts. Instrumentation works by
 * patching modules at require() time — if @nestjs/core or http load first,
 * they capture unpatched references and no spans are ever produced.
 *
 * Exporter is chosen by env:
 *   OTEL_EXPORTER_OTLP_ENDPOINT set -> OTLP over HTTP, batched
 *   unset                           -> console, one span at a time (local dev)
 */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// OTEL_EXPORTER_OTLP_ENDPOINT to send spans/trace to a collector, e.g jaeger, zipkin, or OTEL collector. If not set, spans are logged to console.
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

//if endpoint is set, we send real spans to the collector, otherwise we log to console for local dev.
const spanProcessor: SpanProcessor = otlpEndpoint
  ? new BatchSpanProcessor(
      new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    )
  : new SimpleSpanProcessor(new ConsoleSpanExporter());

//create and config send spans, namespace, service, app,...
const sdk = new NodeSDK({
  resource: defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'learning-graphql',
    }),
  ),
  spanProcessors: [spanProcessor],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Spans every fs call. Drowns everything else.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

//start the SDK, which enables the OpenTelemetry APIs to record telemetry
sdk.start();

//gracefully shutdown the SDK on process exit, ensuring all spans are flushed
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void sdk.shutdown().finally(() => process.exit(0));
  });
}
