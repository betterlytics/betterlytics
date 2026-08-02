import type { ReactNode } from "react";
import {
  AntigravityLogo,
  ClaudeLogo,
  CodexLogo,
  CursorLogo,
  VsCodeLogo,
  WindsurfLogo,
} from "./ClientLogos";

export const MCP_SERVER_URL = "https://betterlytics.io/api/mcp";
export const SERVER_NAME = "betterlytics";
export const TOKEN_PLACEHOLDER = "btl_your_token_here";

export type SnippetLang = "json" | "bash" | "toml";

export type Variant = {
  label: string;
  note?: ReactNode;
  lang: SnippetLang;
  code: (token: string) => string;
};

export type InstallLink = {
  label: string;
  href: (token: string) => string;
  hintWithoutToken: string;
};

export type Client = {
  id: string;
  name: string;
  Logo: (props: { className?: string }) => ReactNode;
  intro?: ReactNode;
  install?: InstallLink;
  snippetLead: ReactNode;
  variants: Variant[];
  outro?: ReactNode;
};

function toBase64(value: string): string {
  return typeof btoa === "function"
    ? btoa(value)
    : Buffer.from(value, "utf8").toString("base64");
}

const remoteConfig = (token: string) => ({
  url: MCP_SERVER_URL,
  headers: { Authorization: `Bearer ${token}` },
});

function cursorInstallLink(token: string): string {
  const config = toBase64(JSON.stringify(remoteConfig(token)))
    .replace(/\+/g, "%2B")
    .replace(/\//g, "%2F");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${SERVER_NAME}&config=${config}`;
}

function vsCodeInstallLink(token: string): string {
  const hasToken = token !== TOKEN_PLACEHOLDER;

  const config = {
    type: "http",
    url: MCP_SERVER_URL,
    headers: {
      Authorization: `Bearer ${hasToken ? token : "${input:btl-token}"}`,
    },
  };
  const params = [`name=${SERVER_NAME}`];
  if (!hasToken) {
    params.push(
      `inputs=${encodeURIComponent(
        JSON.stringify([
          {
            type: "promptString",
            id: "btl-token",
            description: "Betterlytics MCP token",
            password: true,
          },
        ]),
      )}`,
    );
  }

  params.push(`config=${encodeURIComponent(JSON.stringify(config))}`);
  return `https://vscode.dev/redirect/mcp/install?${params.join("&")}`;
}

const mcpServersJson = (token: string, body: Record<string, unknown>) =>
  JSON.stringify({ mcpServers: { [SERVER_NAME]: body } }, null, 2);

export const CLIENTS: Client[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    Logo: ClaudeLogo,
    intro: (
      <>
        <p>
          Claude Desktop&apos;s <strong>Connectors</strong> UI can now pass a
          bearer token through its{" "}
          <a
            href="https://claude.com/docs/connectors/custom/remote-mcp"
            target="_blank"
            rel="noreferrer"
          >
            Request headers
          </a>{" "}
          field — add a custom connector pointing at{" "}
          <code>https://betterlytics.io/api/mcp</code> with an{" "}
          <code>Authorization</code> header set to{" "}
          <code>Bearer &lt;your token&gt;</code>. That feature is still in beta
          and rolling out gradually, so if you don&apos;t see it, use the{" "}
          <a
            href="https://www.npmjs.com/package/mcp-remote"
            target="_blank"
            rel="noreferrer"
          >
            <code>mcp-remote</code>
          </a>{" "}
          proxy below instead (requires{" "}
          <a href="https://nodejs.org/" target="_blank" rel="noreferrer">
            Node.js
          </a>{" "}
          installed).
        </p>
      </>
    ),
    snippetLead: (
      <>
        Open <strong>Settings &gt; Developer &gt; Edit Config</strong> to reveal{" "}
        <code>claude_desktop_config.json</code>, then add{" "}
        <code>betterlytics</code> to <code>mcpServers</code>:
      </>
    ),
    variants: [
      {
        label: "macOS / Linux",
        lang: "json",
        code: (token) =>
          mcpServersJson(token, {
            command: "npx",
            args: [
              "-y",
              "mcp-remote",
              MCP_SERVER_URL,
              "--header",
              `Authorization:Bearer ${token}`,
            ],
          }),
      },
      {
        label: "Windows",
        note: (
          <>
            Claude Desktop spawns <code>npx.cmd</code> through{" "}
            <code>cmd.exe /C</code> without quoting the path, which breaks on the
            space in <code>C:\Program Files\nodejs\</code>. Invoke{" "}
            <code>cmd</code> yourself instead so it can resolve <code>npx</code>{" "}
            via PATH:
          </>
        ),
        lang: "json",
        code: (token) =>
          mcpServersJson(token, {
            command: "cmd",
            args: [
              "/c",
              "npx",
              "-y",
              "mcp-remote",
              MCP_SERVER_URL,
              "--header",
              `Authorization:Bearer ${token}`,
            ],
          }),
      },
    ],
    outro: (
      <p>
        After saving, fully quit Claude Desktop (tray icon &gt; Quit on Windows,
        ⌘Q on macOS) and reopen it.
      </p>
    ),
  },
  {
    id: "claude-code",
    name: "Claude Code",
    Logo: ClaudeLogo,
    snippetLead: (
      <>
        Run this in your project directory. Add <code>--scope user</code> to make
        it available across all your projects:
      </>
    ),
    variants: [
      {
        label: "Terminal",
        lang: "bash",
        code: (token) =>
          `claude mcp add --transport http ${SERVER_NAME} ${MCP_SERVER_URL} \\\n  --header "Authorization: Bearer ${token}"`,
      },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    Logo: CursorLogo,
    install: {
      label: "Add to Cursor",
      href: cursorInstallLink,
      hintWithoutToken:
        "Opens Cursor with the server pre-filled — paste your token above first and it installs ready to use.",
    },
    snippetLead: (
      <>
        Or add to <code>.cursor/mcp.json</code> in your project directory:
      </>
    ),
    variants: [
      {
        label: "mcp.json",
        lang: "json",
        code: (token) => mcpServersJson(token, remoteConfig(token)),
      },
    ],
  },
  {
    id: "vs-code",
    name: "VS Code",
    Logo: VsCodeLogo,
    install: {
      label: "Add to VS Code",
      href: vsCodeInstallLink,
      hintWithoutToken:
        "Opens VS Code and prompts you for your token — nothing else to fill in.",
    },
    snippetLead: (
      <>
        Or add to <code>.vscode/mcp.json</code> in your project directory:
      </>
    ),
    variants: [
      {
        label: "mcp.json",
        lang: "json",
        code: (token) =>
          JSON.stringify(
            {
              servers: {
                [SERVER_NAME]: { type: "http", ...remoteConfig(token) },
              },
            },
            null,
            2,
          ),
      },
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    Logo: WindsurfLogo,
    snippetLead: (
      <>
        Add to your{" "}
        <a
          href="https://docs.devin.ai/desktop/cascade/mcp"
          target="_blank"
          rel="noreferrer"
        >
          MCP config
        </a>{" "}
        (<code>~/.codeium/windsurf/mcp_config.json</code>):
      </>
    ),
    variants: [
      {
        label: "mcp_config.json",
        lang: "json",
        code: (token) =>
          mcpServersJson(token, {
            serverUrl: MCP_SERVER_URL,
            headers: { Authorization: `Bearer ${token}` },
          }),
      },
    ],
  },
  {
    id: "antigravity",
    name: "Antigravity",
    Logo: AntigravityLogo,
    snippetLead: (
      <>
        Add to your{" "}
        <a
          href="https://antigravity.google/docs/mcp"
          target="_blank"
          rel="noreferrer"
        >
          MCP config
        </a>{" "}
        — <code>~/.gemini/config/mcp_config.json</code> globally, or{" "}
        <code>.agents/mcp_config.json</code> for a single workspace:
      </>
    ),
    variants: [
      {
        label: "mcp_config.json",
        lang: "json",
        code: (token) =>
          mcpServersJson(token, {
            serverUrl: MCP_SERVER_URL,
            headers: { Authorization: `Bearer ${token}` },
          }),
      },
    ],
  },
  {
    id: "codex",
    name: "Codex",
    Logo: CodexLogo,
    snippetLead: (
      <>
        Add to <code>~/.codex/config.toml</code>:
      </>
    ),
    variants: [
      {
        label: "config.toml",
        lang: "toml",
        code: (token) =>
          `[mcp_servers.${SERVER_NAME}]\nurl = "${MCP_SERVER_URL}"\nhttp_headers = { "Authorization" = "Bearer ${token}" }`,
      },
    ],
    outro: (
      <p>
        To keep the token out of the config file, drop the{" "}
        <code>http_headers</code> line and use{" "}
        <code>bearer_token_env_var = &quot;BETTERLYTICS_MCP_TOKEN&quot;</code>{" "}
        instead — Codex then reads the token from your environment at connection
        time.
      </p>
    ),
  },
];

export const DEFAULT_CLIENT_ID = "claude-code";

export function isClientId(value: string | null | undefined): value is string {
  return !!value && CLIENTS.some((client) => client.id === value);
}
