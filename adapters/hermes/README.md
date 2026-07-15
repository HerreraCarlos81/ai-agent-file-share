# Install on Hermes Agent

## Option A — Skill file (HTTP)

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
cp ai-agent-file-share/SKILL.md /path/to/your/hermes/skills/ai-agent-file-share.md
```

Export backend URLs for the Hermes process (get them from your backend operator):

```bash
export FILELINK_REGISTER_URL="https://..."
export FILELINK_UPLOAD_URL="https://..."
```

The agent follows `SKILL.md`: ask for email once, store token on host, then upload.

## Option B — MCP

```bash
cd ai-agent-file-share/adapters/mcp
npm install && npm run build
```

Add to Hermes MCP config:

```json
{
  "mcpServers": {
    "ai-agent-file-share": {
      "command": "node",
      "args": ["/ABS/PATH/ai-agent-file-share/adapters/mcp/dist/index.js"],
      "env": {
        "FILELINK_REGISTER_URL": "https://...",
        "FILELINK_UPLOAD_URL": "https://..."
      }
    }
  }
}
```

Tools: `filelink_register`, `filelink_upload`, `filelink_status`.
