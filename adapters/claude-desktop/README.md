# Install on Claude Desktop

1. Clone and build the MCP adapter:

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
cd ai-agent-file-share/adapters/mcp
npm install && npm run build
```

2. Edit Claude Desktop config:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ai-agent-file-share": {
      "command": "node",
      "args": [
        "/ABS/PATH/ai-agent-file-share/adapters/mcp/dist/index.js"
      ],
      "env": {
        "FILELINK_REGISTER_URL": "https://...",
        "FILELINK_UPLOAD_URL": "https://..."
      }
    }
  }
}
```

3. Restart Claude Desktop and enable the tools.
