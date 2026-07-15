---
name: ai-agent-file-share
description: Temporary file transfer for AI agents via signed download URLs (max 24h). Register with an email, upload Base64 content, share a link. Token stays on the host and is never shown to the end user.
version: 1.0.0
---

# Skill: AI Agent File Share

Share files with the user through temporary signed download links (maximum 24 hours). Files are removed automatically by the backend after that window.

## When to use

- User asks to download a report, CSV, PDF, image, ZIP, or any generated file
- You need a safe one-click download link instead of pasting large binary content in chat

## Host configuration (required)

These must already be set for the agent process (or MCP server env). **Never invent URLs.**

| Variable | Required | Description |
|----------|----------|-------------|
| `FILELINK_REGISTER_URL` | Yes | HTTP endpoint for account registration |
| `FILELINK_UPLOAD_URL` | Yes | HTTP endpoint for authenticated upload |
| `FILELINK_EMAIL` | After register | Reference email stored on host |
| `FILELINK_TOKEN` | After register | Bearer token stored on host only |

If URLs are missing, tell the user that File Share is not configured and stop.

## Security rules (mandatory)

1. After registration, store `token` and `email` on the host (env file, credentials file, or secret store).
2. **Never** print, quote, or summarize the token in chat.
3. **Never** tell the user that a token system exists; say only that the account was linked.
4. Prefer MCP tools when available so the token never enters the model context after register.

## Flow

### Step 0 — Already registered?

If `FILELINK_TOKEN` is set and non-empty on the host (or MCP `filelink_status` reports registered) → go to **Upload**.

### Step 1 — Registration (once)

1. Ask: *"Which email should we use as the reference for your account? Any email is fine."*
2. Do not ask for a password.
3. Request:

```http
POST {FILELINK_REGISTER_URL}
Content-Type: application/json

{"email":"<user_email>"}
```

4. On HTTP 200, body includes `token` and `email`.
5. Silently persist token + email on the host.
6. Reply only: *"Account linked to &lt;email&gt;. Ready to send files."*

### Step 2 — Upload

1. Obtain file bytes (path or generated content).
2. Base64-encode the content.
3. Request:

```http
POST {FILELINK_UPLOAD_URL}
Content-Type: application/json
Authorization: Bearer {FILELINK_TOKEN}

{
  "filename": "report.pdf",
  "content_base64": "<base64>",
  "expires_in": 86400
}
```

`expires_in` is optional (seconds, max `86400`).

4. Error handling:
   - **401** `TOKEN_MISSING` / `TOKEN_INVALID` → re-run registration; do not show token
   - **403** `TOKEN_INACTIVE` → *"This account is inactive. Contact the administrator."*
5. On **200**, present only:

```markdown
📥 Your file is ready:
**[filename](download_url)**
⏱️ Valid until `expires_at_iso` (max 24h). The file is removed after that.
```

Do not expose `s3_key`, hashes, raw tokens, or internal metrics unless the user asks for account stats.

## MCP tools (if installed)

| Tool | Args | Behavior |
|------|------|----------|
| `filelink_status` | — | Whether a local token exists (no secret leak) |
| `filelink_register` | `email` | Register; stores token on host; does **not** return token to the model |
| `filelink_upload` | `filename`, `content_base64`, `expires_in?` | Returns signed `download_url` |

## Limits

- Max URL lifetime: 24 hours (`86400` seconds)
- Payload size limits are enforced by the backend
