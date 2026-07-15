# Install on any agent / scripts

## Skill / system prompt

1. Give the agent the contents of root `SKILL.md`.
2. Configure `FILELINK_REGISTER_URL` and `FILELINK_UPLOAD_URL`.
3. Ensure the agent can perform HTTPS POST and store secrets on the host.

## curl smoke test

```bash
# Register
curl -s -X POST "$FILELINK_REGISTER_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'

# Upload (TOKEN from register response — keep secret)
curl -s -X POST "$FILELINK_UPLOAD_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"filename":"hello.txt","content_base64":"aGVsbG8=","expires_in":3600}'
```

## MCP

Build `../mcp` and point any MCP client at `dist/index.js` with the two URL env vars.
