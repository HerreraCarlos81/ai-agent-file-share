# AI Agent File Share

**Skill package** for AI agents: share files with users via temporary signed download links (max 24 hours).

This repository is **only for installing the skill** on agents (Hermes, Claude Code, Claude Desktop, Cursor, OpenClaw, and others).  
It does **not** include AWS infrastructure, Lambdas, or deploy scripts. The HTTP backend is operated separately; you only need the two endpoint URLs.

---

## What you get

| Path | Purpose |
|------|---------|
| [`SKILL.md`](SKILL.md) | Canonical skill instructions (register once → upload → share link) |
| [`adapters/mcp/`](adapters/mcp/) | Optional thin MCP server (stdio) that calls the backend over HTTPS |
| [`adapters/*/`](adapters/) | Install notes per agent |
| [`.env.example`](.env.example) | Environment variable names |

---

## How it works (agent side)

1. **First use:** agent asks the user for a reference email → `POST` register URL → stores the returned **token on the host** (never shows it in chat).
2. **Upload:** agent Base64-encodes the file → `POST` upload URL with `Authorization: Bearer <token>` → receives a **signed download URL**.
3. **User:** clicks the link and downloads the file. The link expires within 24 hours (backend policy).

```text
User  ←→  Agent (+ this skill)
                │
                │  HTTPS (register / upload)
                ▼
         Your File Share API
         (already deployed elsewhere)
```

---

## Prerequisites

1. A running **File Share backend** that implements the API below (ask your operator for URLs).
2. Node.js 18+ **only if** you use the MCP adapter.
3. Ability to set environment variables (or MCP `env`) for the agent process.

### Required environment variables

| Variable | Description |
|----------|-------------|
| `FILELINK_REGISTER_URL` | Registration endpoint |
| `FILELINK_UPLOAD_URL` | Upload endpoint |
| `FILELINK_EMAIL` | Set after registration (host only) |
| `FILELINK_TOKEN` | Set after registration (host only; secret) |

Copy [`.env.example`](.env.example) and fill the two URLs before first use.

---

## Expected backend API (for operators)

Agents and the MCP adapter call:

### Register

```http
POST {FILELINK_REGISTER_URL}
Content-Type: application/json

{"email":"user@example.com"}
```

**200** example:

```json
{
  "success": true,
  "email": "user@example.com",
  "token": "<secret-once>",
  "message": "..."
}
```

### Upload

```http
POST {FILELINK_UPLOAD_URL}
Content-Type: application/json
Authorization: Bearer <token>

{
  "filename": "report.pdf",
  "content_base64": "...",
  "expires_in": 86400
}
```

**200** must include at least `download_url`, `filename`, and preferably `expires_at_iso`.

| Error body `code` | HTTP | Meaning |
|-------------------|------|---------|
| `TOKEN_MISSING` | 401 | No Bearer token |
| `TOKEN_INVALID` | 401 | Unknown token |
| `TOKEN_INACTIVE` | 403 | Account revoked |

This skill does not deploy that backend; it only consumes it.

---

## Install by agent

### Hermes Agent

**Skill file**

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
# Point Hermes at SKILL.md (copy or symlink into your skills directory)
cp ai-agent-file-share/SKILL.md /path/to/hermes/skills/ai-agent-file-share.md
```

Export for the Hermes process:

```bash
export FILELINK_REGISTER_URL="https://..."
export FILELINK_UPLOAD_URL="https://..."
```

**MCP (optional)**

```bash
cd ai-agent-file-share/adapters/mcp
npm install && npm run build
```

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

More: [`adapters/hermes/README.md`](adapters/hermes/README.md)

---

### Claude Code

```bash
git clone https://github.com/HerreraCarlos81/ai-agent-file-share.git
mkdir -p .claude/skills/ai-agent-file-share
cp ai-agent-file-share/SKILL.md .claude/skills/ai-agent-file-share/SKILL.md
```

Set `FILELINK_REGISTER_URL` and `FILELINK_UPLOAD_URL` in project `.env` or your shell.

More: [`adapters/claude-code/README.md`](adapters/claude-code/README.md)

---

### Claude Desktop

1. Clone this repo and build the MCP adapter (`adapters/mcp`: `npm install && npm run build`).
2. Edit Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

3. Restart Claude Desktop.

More: [`adapters/claude-desktop/README.md`](adapters/claude-desktop/README.md)

---

### Cursor

Add the same MCP block under **Settings → MCP**, or paste [`SKILL.md`](SKILL.md) into project rules and set the two URL env vars.

More: [`adapters/cursor/README.md`](adapters/cursor/README.md)

---

### OpenClaw

Copy `SKILL.md` into OpenClaw’s skills directory; export `FILELINK_*` URLs. Prefer MCP when available for safer token storage (`~/.config/agent-filelink/credentials.json`).

More: [`adapters/openclaw/README.md`](adapters/openclaw/README.md)

---

### Windsurf / Codex / other agents

- **MCP-capable:** use `adapters/mcp` like Cursor / Claude Desktop.
- **Prompt / rules only:** install `SKILL.md` as a skill or system rule and provide HTTP access + env URLs.

More: [`adapters/generic/README.md`](adapters/generic/README.md)

---

## MCP tools

| Tool | Description |
|------|-------------|
| `filelink_register` | Register email; stores token on disk; **does not** return token to the model |
| `filelink_upload` | Upload Base64 file; returns signed `download_url` |
| `filelink_status` | Whether credentials exist locally (no secret leak) |

Default credential path: `~/.config/agent-filelink/credentials.json` (mode `600`).

---

## End-user experience

1. Agent asks for a reference email (first time only).
2. Agent confirms the account is linked (no secrets).
3. When a file is ready:

```markdown
📥 Your file is ready:
**[report.pdf](https://…signed-url…)**
⏱️ Valid until … (max 24h).
```

---

## Security

- Token is a host secret; never paste it into chat or logs.
- Registration returns the token **once**; only the host should keep it.
- Upload requires `Authorization: Bearer`.
- If the backend reports `TOKEN_INACTIVE`, the account was revoked by the operator.

---

## What this repo is not

- Not an AWS / Terraform / Lambda deploy kit  
- Not a self-hosted S3 stack  
- Not a multi-tenant control panel  

Those live in a **separate** backend project. This repo is the **client skill** only.

---

## License

MIT — see [LICENSE](LICENSE).

## Maintainer

Carlos Herrera ([@HerreraCarlos81](https://github.com/HerreraCarlos81))
