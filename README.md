# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Authentication

See [AUTH_README.md](./AUTH_README.md) for the authentication flow, route guards, tRPC authorization, database storage, and required environment variables.

## Groq workflow node

The Groq node sends prompts to Groq-hosted models and requires a server-side `GROQ_API_KEY`. Get a key from [Groq Console](https://console.groq.com/keys), then add it to your local environment. The node loads available models from Groq's [Models API](https://console.groq.com/docs/models). Groq's [free plan](https://console.groq.com/docs/rate-limits) has per-model rate limits; check your account's current limits before relying on it for a workload.
