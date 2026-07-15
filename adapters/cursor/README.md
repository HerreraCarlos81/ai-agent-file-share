# Install on Cursor

## MCP

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
cd ai-agent-file-share/adapters/mcp
npm install && npm run build
```

Cursor Settings → MCP:

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

## Rules only

Copy root `SKILL.md` into project rules / `.cursorrules` and set the two URL environment variables for the agent.
