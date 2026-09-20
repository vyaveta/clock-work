import { vercelAIIntegration } from "@sentry/nextjs";

// Import with `import * as Sentry from "@sentry/nextjs"` if you are using ESM
const Sentry = require("@sentry/nextjs");

Sentry.init({
  dsn: "https://b4123c116870ee09c89dabcdee2d1bad@o4512119528882176.ingest.de.sentry.io/4512119548346448",
  // Tracing must be enabled for agent monitoring to work
  tracesSampleRate: 1.0,
  integrations: [
    vercelAIIntegration(),
  ],
  dataCollection: {
    // Control data collection of LLMs and tools.
    // For more info visit: https://docs.sentry.io/platforms/javascript/data-management/data-collected/
    // genAI: { inputs: false, outputs: false },
  },
});