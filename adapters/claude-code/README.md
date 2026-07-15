# Install on Claude Code

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
mkdir -p .claude/skills/ai-agent-file-share
cp ai-agent-file-share/SKILL.md .claude/skills/ai-agent-file-share/SKILL.md
```

Set in project `.env` or shell:

```bash
FILELINK_REGISTER_URL=https://...
FILELINK_UPLOAD_URL=https://...
```

Ask Claude Code to send a file for download; it should follow the skill (register once, then upload).

Optional: if your Claude Code setup supports MCP, use the same config as Claude Desktop with `adapters/mcp`.
