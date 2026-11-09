# Gmail send node: setup and code walkthrough

This guide takes the integration from an unconfigured checkout to a sent test email. It explains what Google configuration is needed, where each value goes, how to connect an account, and what the node does during execution.

## What this node does

**Send Gmail** is an action node in the workflow editor. It sends one plain text email from a Google account linked to the Clock Work user who owns the workflow. The node stores only its settings in the workflow: result variable name, recipient, subject, and body. It does not store Google credentials.

Subject, recipient, and body are rendered against the workflow context using Handlebars. For example, if an upstream Google Form trigger provides `googleForm.respondentEmail`, you can enter `{{googleForm.respondentEmail}}` as the recipient. The result is added under the chosen variable name and contains:

- `messageId`: Gmail's ID for the sent message.
- `threadId`: Gmail's conversation/thread ID.
- `to`: the resolved recipient address.
- `sent`: `true` when Gmail accepted the send request.

The initial version accepts one recipient and plain text only. It has no CC, BCC, HTML, attachments, or account picker.

## Setup checklist

You need:

1. A running Clock Work deployment with its database configured. The Better Auth `account` table stores the connected Google account and OAuth tokens.
2. A Google Cloud project with the Gmail API enabled and a Web application OAuth client.
3. These two **server-side** environment variables:

   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

4. A user account signed in to Clock Work.
5. A successful Google connection from the Gmail node's **Connect Gmail** button.
6. A saved workflow with the Send Gmail node configured and connected downstream from a trigger.

No Google API key or service account key is used. Gmail sends are performed using the user's OAuth authorization. The client ID identifies this application to Google; the client secret allows the server to complete confidential OAuth token exchanges. The user's refresh token authorizes later sends on that user's behalf.

## Step 1: Create/configure a Google Cloud project

1. In Google Cloud Console, select an existing project or create one for this application.
2. In **APIs & Services → Library**, find and enable **Gmail API**. OAuth credentials identify the app, while enabling the API allows this project to call Gmail's API.
3. Configure the **OAuth consent screen** / Google Auth Platform branding and audience:
   - Use the audience appropriate for your deployment. For a private test, use the testing/external setup and add each Google account that will test as a test user. For a Workspace-only deployment, the organization may require an internal audience.
   - Add the purpose and contact details requested by Google.
   - Add the exact scope `https://www.googleapis.com/auth/gmail.send`.
   - Publish or submit the app for verification as required by your audience and launch plan. Google's scope classification and verification requirements can apply to this Gmail permission. Testing-mode limits and test-user access can prevent other accounts from connecting.

The code requests `gmail.send`, the narrow Gmail API scope needed to send mail. It does not request permission to read the user's inbox. Ordinary Google sign-in requests only `openid`, `email`, and `profile`; the Gmail send scope is requested later by the authenticated Gmail-node connection flow. See Google's [Gmail API scopes guide](https://developers.google.com/workspace/gmail/api/auth/scopes) and [OAuth production readiness guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance) for the current consent and verification requirements.

## Step 2: Create the OAuth client

1. In Google Cloud Console, open **Google Auth Platform → Clients** (or **APIs & Services → Credentials**, depending on the console view).
2. Choose **Create client** and select **Web application**. This is a server-side web OAuth flow, not an API key or desktop app flow.
3. Add every app origin from which users will start the connection under **Authorized JavaScript origins**. Examples:
   - Local: `http://localhost:3000`
   - Production: `https://your-app.example.com`
4. Add the Better Auth Google callback as an **Authorized redirect URI**. It must match the app's actual origin exactly:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app.example.com/api/auth/callback/google`
5. Save the client. Copy its client ID and client secret into the app's server environment as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

The callback path is handled by the existing Better Auth route at `/api/auth/[...all]`. Google sends the browser back there after approval so Better Auth can validate the OAuth response and save the resulting account tokens. Scheme, hostname, port, path, and trailing slash must match the registered redirect URI. A mismatch commonly appears as Google's `redirect_uri_mismatch` error. Google allows localhost HTTP for development; use HTTPS for a deployed app. See Google's [Web server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server).

## Step 3: Add keys to the server environment

Set the values wherever the Next.js server runs: local `.env`/environment configuration, and your hosting provider's server environment settings for deployment.

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Do not add a `NEXT_PUBLIC_` prefix, commit the secret, or put it in the node's fields. Better Auth reads these variables in `lib/auth.ts`; the executor also uses them when it exchanges an expired access token for a new one. Restart/redeploy the server after setting them.

The app also needs its normal database environment because both Better Auth account records and workflow ownership are read from PostgreSQL. Workflow execution additionally depends on the existing Inngest setup.

## Step 4: Connect the Google account in Clock Work

1. Sign in to Clock Work as the user who owns the workflow.
2. Open or create a workflow, add **Send Gmail** from the Actions list, then open its settings.
3. Select **Connect Gmail**. The browser starts Better Auth's Google account-link flow.
4. Choose the Google account that should send mail and approve the requested Gmail send permission.
5. After returning to Clock Work, open the node settings again if needed. The status should say the Google account is connected.

Better Auth links the Google identity to the current Clock Work user. This node action requests the Gmail send scope. Because that is an additional scope beyond normal Google sign-in, Google asks the user to grant the send permission during this connection flow. The provider is configured for offline access and a consent prompt so Google returns a refresh token for workflow runs, including when this account has already granted Gmail access. Better Auth stores the access token, refresh token, provider ID, and granted scopes in its existing `account` table. The node settings do not contain either token. The status check considers the account connected only when its stored scope includes `gmail.send` and it has a refresh token.

The Google provider is shared with Better Auth's Google sign-in, but the provider's default scopes are identity-only. Therefore the normal sign-in and sign-up buttons do not ask users for Gmail send permission. The additional scope is passed only by the Gmail node's `linkSocial()` call after a user is signed in and chooses **Connect Gmail**. The provider's consent prompt setting applies to Google OAuth generally, but the Gmail send permission is absent from ordinary sign-in requests. A user may connect a Google address that differs from their Clock Work login address; this is permitted only in the authenticated account-linking flow. The current implementation does not offer a per-node Google account selector; use one connected Gmail identity per Clock Work user to avoid ambiguity.

This app does not currently send local email verification messages. Better Auth allows an existing unverified email/password account to be linked when the OAuth provider reports that same email as verified. This allows Google sign-in for accounts that previously hit `account_not_linked` because their local email was unverified, while still requiring Google's verified-email claim.

## Step 5: Configure and save the node

Fill in:

- **Result variable**: a JavaScript-like identifier such as `emailResult`. Downstream nodes can reference fields using this variable name.
- **To**: one email address. It can be a template, for example `{{googleForm.respondentEmail}}`. At execution time, the resolved value must be a single valid email address; comma-separated recipients are rejected.
- **Subject**: subject text. It supports upstream Handlebars values.
- **Message**: plain text body. It supports upstream Handlebars values. Use the variables shown in the dialog to insert data from previous nodes.

Example:

```text
To: {{googleForm.respondentEmail}}
Subject: Thanks for your response, {{googleForm.respondentName}}
Message:
Hi {{googleForm.respondentName}},

We received your form response on {{googleForm.timestamp}}.
```

The recipient email and subject variables in this example are illustrative; use paths actually provided by the upstream trigger. Save the workflow in the editor before running it so the executor receives the latest node settings.

## What happens when the workflow runs

The code path is:

1. The workflow executor reaches the node and validates that variable name, recipient, subject, and body exist.
2. It loads the workflow owner from the database using the workflow ID. The Google account is looked up for that owner, rather than accepting an account ID from editable node data.
3. Handlebars renders recipient, subject, and body against the current workflow context. The recipient is checked for one valid email address.
4. The executor finds the owner's linked Google account that granted `gmail.send`. If the access token is expired or has no expiry, it posts the refresh token and app's client credentials to Google's token endpoint. The new access token and expiry are saved back to the Better Auth account record.
5. The executor formats a UTF-8 plain-text MIME message, base64url-encodes it, and calls `https://gmail.googleapis.com/gmail/v1/users/me/messages/send` with the access token.
6. Gmail's `messageId` and `threadId` are returned in workflow context under the configured result variable.

The send operation runs inside an Inngest durable step. If the send step completes and a later workflow step fails/retries, Inngest can reuse the completed step result instead of sending that same message again. A new workflow run is a new send.

## Common setup errors

| Symptom | Likely cause and next step |
| --- | --- |
| Google says `redirect_uri_mismatch` | Register the exact callback URI for the origin being used: `/api/auth/callback/google`. Check protocol, hostname, port, path, and trailing slash. |
| Google OAuth client error / provider unavailable | Check server `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; restart the app after changing them. Confirm the client is a Web application client. |
| App is blocked or the tester cannot connect | Check consent-screen audience, test-user list, publishing status, requested scope, and any required Google verification. |
| Node says the Google account is not connected | Use **Connect Gmail** while signed into the same Clock Work user who owns the workflow. Confirm consent was granted and reopen node settings. |
| Node says credentials are not configured | Set both server environment variables in the environment running workflow execution; client/browser environment variables do not count. |
| Token refresh fails or the grant was revoked | Reconnect the Google account and approve access again. Check that the same OAuth client ID/secret are configured as when the account was linked. |
| Gmail returns insufficient permission / 403 | The linked account may not have the `gmail.send` scope. Reconnect and approve the Gmail send permission; confirm Gmail API is enabled in the Google project. |
| Gmail rejects the message | Check the rendered recipient, Gmail account status/limits, and the API error surfaced by the workflow run. The node accepts a single address, not a recipient list. |

## Security and current limitations

- The client secret and user refresh tokens are credentials. Keep them server-side and restrict access to the database/environment.
- The node sends only from the linked user's Gmail account; it cannot impersonate another sender address.
- This version sends one plain-text message to one recipient per node execution. No attachments, HTML, CC, BCC, or multiple-recipient list.
- The implementation selects a linked Google account by user and granted scope but has no UI to choose between multiple eligible accounts.
- Google may show an unverified-app warning or restrict test users until the consent configuration and applicable verification are complete.
- Because this app does not have local email verification, Better Auth may link an existing unverified email/password account when the OAuth provider returns that same address as verified. Only use this configuration with providers that reliably verify email ownership.
