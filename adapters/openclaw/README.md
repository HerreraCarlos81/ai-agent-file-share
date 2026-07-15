# Install on OpenClaw

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
# Copy into OpenClaw skills directory (see OpenClaw docs for path)
cp ai-agent-file-share/SKILL.md /path/to/openclaw/skills/ai-agent-file-share.md
```

```bash
export FILELINK_REGISTER_URL="https://..."
export FILELINK_UPLOAD_URL="https://..."
```

Prefer the MCP adapter if OpenClaw supports MCP, so the token is stored under `~/.config/agent-filelink/credentials.json` and not exposed to the model.
