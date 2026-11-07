# Authentication

Clock Work uses [Better Auth](https://www.better-auth.com/) for email and password authentication. Better Auth owns credential validation, password hashing, session creation, cookies, and session expiry; the application asks Better Auth to validate each incoming session instead of trusting client-side state.

## Request flow

1. **Sign up and sign in:** The client forms in `features/auth/components/signup-form.tsx` and `features/auth/components/signin.tsx` validate fields with Zod and call `authClient.signUp.email` or `authClient.signIn.email`. Better Auth handles the request and sets the session cookie. Errors are converted to user-facing messages by `features/auth/lib/auth-error-message.ts`.
2. **Auth API:** `app/api/auth/[...all]/route.ts` forwards `GET` and `POST` requests to Better Auth through `toNextJsHandler`.
3. **Persistence:** `lib/auth.ts` configures Better Auth with the Prisma PostgreSQL adapter. Better Auth's user, account, and session records are stored in the database described by `prisma/schema.prisma`.
4. **Read a session on the server:** `lib/auth-utils.ts` calls `auth.api.getSession` with the current request headers. React `cache` reuses the result during a server render. `requireAuth()` redirects anonymous visitors to `/signin` and returns the validated session to its caller. `requireUnauth()` redirects signed-in visitors away from `/signin` and `/signup` to `/`.
5. **Protect tRPC operations:** `trpc/init.ts` resolves the session once while creating request context. `protectedProcedure` rejects requests without a valid session with `UNAUTHORIZED`; authorized procedures receive the validated session as `ctx.auth`. Workflow routers use `ctx.auth.user.id` when reading or changing user-owned workflow data.

The dashboard pages call `requireAuth()` as a page-level guard. This improves navigation and avoids rendering protected pages for signed-out visitors. The protected tRPC procedure is the authorization boundary for data operations; a page redirect alone must not be treated as data authorization.

## Configuration

Set these server-side environment variables before starting the app:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma and Better Auth. |
| `BETTER_AUTH_SECRET` | Secret Better Auth uses to sign and protect session data. Keep it private and use a strong random value. |
| `BETTER_AUTH_URL` | Public base URL of the application, such as `http://localhost:3000` in local development. |

The browser client in `lib/auth-client.ts` uses Better Auth's default `/api/auth` endpoint. Email/password authentication is enabled in `lib/auth.ts`. The sign-in UI also offers Google and GitHub buttons, but those providers need server-side provider credentials and matching Better Auth `socialProviders` configuration before they can complete OAuth sign-in.

## Adding a protected operation

Use `protectedProcedure` for any tRPC query or mutation that requires a signed-in user, and scope database access to `ctx.auth.user.id` where records belong to a user. Keep public operations on `baseProcedure` only when they are intentionally available without a session. For server-rendered pages, call `requireAuth()` before loading protected data.

After changing the Prisma schema for Better Auth, create and apply a Prisma migration so the database tables continue to match the adapter's expected models.
