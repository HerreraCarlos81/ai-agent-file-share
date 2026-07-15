#!/usr/bin/env node
/**
 * Thin MCP adapter for AI Agent File Share.
 * Calls remote register/upload HTTP endpoints only.
 * Token is stored under ~/.config/agent-filelink/credentials.json
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const SECRET_DIR =
  process.env.FILELINK_SECRET_DIR ||
  path.join(os.homedir(), ".config", "agent-filelink");
const SECRET_FILE = path.join(SECRET_DIR, "credentials.json");

const REGISTER_URL = process.env.FILELINK_REGISTER_URL || "";
const UPLOAD_URL = process.env.FILELINK_UPLOAD_URL || "";

type Creds = { email?: string; token?: string };

function loadCreds(): Creds {
  try {
    return JSON.parse(fs.readFileSync(SECRET_FILE, "utf8")) as Creds;
  } catch {
    return {};
  }
}

function saveCreds(email: string, token: string) {
  fs.mkdirSync(SECRET_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    SECRET_FILE,
    JSON.stringify({ email, token }, null, 2),
    { encoding: "utf8", mode: 0o600 }
  );
}

async function httpPost(
  url: string,
  body: unknown,
  token?: string
): Promise<{ status: number; data: any }> {
  if (!url) {
    throw new Error(
      "FILELINK_REGISTER_URL / FILELINK_UPLOAD_URL is not configured"
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

const server = new Server(
  { name: "ai-agent-file-share", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "filelink_register",
      description:
        "Register a reference email and store the access token on the host. Never show the token to the user. Call once before first upload.",
      inputSchema: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "Reference email for this account",
          },
        },
        required: ["email"],
      },
    },
    {
      name: "filelink_upload",
      description:
        "Upload a file (Base64) and return a temporary signed download URL (max 24h).",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "File name with extension, e.g. report.pdf",
          },
          content_base64: {
            type: "string",
            description: "File content encoded as Base64",
          },
          expires_in: {
            type: "number",
            description: "URL lifetime in seconds (60–86400, default 86400)",
          },
        },
        required: ["filename", "content_base64"],
      },
    },
    {
      name: "filelink_status",
      description:
        "Check whether a token is stored on this host (does not reveal the token).",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const a = (args || {}) as Record<string, unknown>;

  try {
    if (name === "filelink_status") {
      const c = loadCreds();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              registered: Boolean(c.token),
              email: c.email || null,
              secret_path: SECRET_FILE,
              urls_configured: Boolean(REGISTER_URL && UPLOAD_URL),
            }),
          },
        ],
      };
    }

    if (name === "filelink_register") {
      const email = String(a.email || "")
        .trim()
        .toLowerCase();
      if (!email) {
        return {
          content: [{ type: "text", text: "email is required" }],
          isError: true,
        };
      }
      const { status, data } = await httpPost(REGISTER_URL, { email });
      if (status !== 200 || !data?.token) {
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          isError: true,
        };
      }
      saveCreds(email, data.token);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              email,
              message:
                "Account linked. Token stored on host. Do not display the token.",
            }),
          },
        ],
      };
    }

    if (name === "filelink_upload") {
      const c = loadCreds();
      if (!c.token) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "No local token. Call filelink_register first.",
                code: "TOKEN_MISSING",
              }),
            },
          ],
          isError: true,
        };
      }
      const { status, data } = await httpPost(
        UPLOAD_URL,
        {
          filename: a.filename,
          content_base64: a.content_base64,
          expires_in: a.expires_in,
        },
        c.token
      );
      if (status >= 400) {
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  if (!REGISTER_URL || !UPLOAD_URL) {
    console.error(
      "Warning: set FILELINK_REGISTER_URL and FILELINK_UPLOAD_URL for this MCP server."
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ai-agent-file-share MCP server running (stdio)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
