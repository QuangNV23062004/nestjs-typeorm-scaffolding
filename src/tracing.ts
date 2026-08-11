/**
 * OpenTelemetry SDK bootstrap.
 *
 * MUST be imported before anything else in main.ts. Instrumentation works by
 * patching modules at require() time — if @nestjs/core or http load first,
 * they capture unpatched references and no spans are ever produced.
 *
 * Exporter is chosen by env:
 *   OTEL_EXPORTER_OTLP_ENDPOINT set -> OTLP over HTTP, batched, full spans
 *   unset                           -> compact console, one line per span
 */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { CompactConsoleSpanExporter } from './tracing-console-exporter';

// OTEL_EXPORTER_OTLP_ENDPOINT to send spans/trace to a collector, e.g jaeger, zipkin, or OTEL collector. If not set, spans are logged to console.
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

//if endpoint is set, we send real spans to the collector, otherwise we log to console for local dev.
const spanProcessor: SpanProcessor = otlpEndpoint
  ? new BatchSpanProcessor(
      new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    )
  : new SimpleSpanProcessor(new CompactConsoleSpanExporter());

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

      // Express 5 ships its router as a separate `router` package, so both
      // instrumentations patch the same layers and every middleware emits two
      // spans: `middleware - <anonymous>` (express) nested under
      // `middleware - patched` (router). Express names them, so keep express.
      '@opentelemetry/instrumentation-router': { enabled: false },

      // cookieParser/helmet/cors/jsonParser/urlencodedParser each cost tens of
      // microseconds and never explain a slow request. The request_handler and
      // router layers still get spans, which is where routing time shows up.
      '@opentelemetry/instrumentation-express': {
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      },

      // A span per field resolver, including the ones that just read a property
      // off the parent object. Real work happens in the DataLoader batch, and
      // that gets its own span from the Prisma/pg instrumentation.
      '@opentelemetry/instrumentation-graphql': {
        ignoreTrivialResolveSpans: true,
      },
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
