import type { ReactNode } from "react";
import {
  AntigravityLogo,
  ClaudeLogo,
  CodexLogo,
  CursorLogo,
  VsCodeLogo,
  WindsurfLogo,
} from "./ClientLogos";
import { needsAllowHttp } from "./serverUrl";

export const SERVER_NAME = "betterlytics";
export const TOKEN_PLACEHOLDER = "btl_your_token_here";

export type SnippetLang = "text" | "json" | "bash" | "toml";

export type SnippetInput = { token: string; serverUrl: string };

export type Variant = {
  label: string;
  note?: ReactNode;
  lang: SnippetLang;
  code: (input: SnippetInput) => string;
};

export type InstallLink = {
  label: string;
  href: (input: SnippetInput) => string;
  hintWithoutToken: string;
};

/** Adding the bare URL: the client finds the sign-in on its own and opens it in the browser. */
export type SignInSetup = {
  install?: { label: string; href: (serverUrl: string) => string };
  lead: ReactNode;
  snippet: { lang: SnippetLang; code: (serverUrl: string) => string };
  after?: ReactNode;
};

/** Sending a personal token in a header, for self-hosts and clients that can't sign in. */
export type TokenSetup = {
  intro?: (serverUrl: string) => ReactNode;
  install?: InstallLink;
  snippetLead: ReactNode;
  variants: Variant[];
  outro?: ReactNode;
};

export type Client = {
  id: string;
  name: string;
  Logo: (props: { className?: string }) => ReactNode;
  signIn: SignInSetup;
  token: TokenSetup;
};

function toBase64(value: string): string {
  return typeof btoa === "function"
    ? btoa(value)
    : Buffer.from(value, "utf8").toString("base64");
}

const mcpRemoteArgs = ({ token, serverUrl }: SnippetInput) => [
  "mcp-remote",
  serverUrl,
  "--header",
  `Authorization:Bearer ${token}`,
  ...(needsAllowHttp(serverUrl) ? ["--allow-http"] : []),
];

const remoteConfig = ({ token, serverUrl }: SnippetInput) => ({
  url: serverUrl,
  headers: { Authorization: `Bearer ${token}` },
});

function cursorInstallLink(config: Record<string, unknown>): string {
  const encoded = toBase64(JSON.stringify(config))
    .replace(/\+/g, "%2B")
    .replace(/\//g, "%2F");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${SERVER_NAME}&config=${encoded}`;
}

function vsCodeInstallLink({ token, serverUrl }: SnippetInput): string {
  const hasToken = token !== TOKEN_PLACEHOLDER;

  const config = {
    type: "http",
    url: serverUrl,
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

function vsCodeSignInInstallLink(serverUrl: string): string {
  const config = { type: "http", url: serverUrl };
  return `https://vscode.dev/redirect/mcp/install?name=${SERVER_NAME}&config=${encodeURIComponent(JSON.stringify(config))}`;
}

const mcpServersJson = (body: Record<string, unknown>) =>
  JSON.stringify({ mcpServers: { [SERVER_NAME]: body } }, null, 2);

const windsurfConfigLead = (
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
);

const antigravityConfigLead = (
  <>
    Add to your{" "}
    <a
      href="https://antigravity.google/docs/mcp"
      target="_blank"
      rel="noreferrer"
    >
      MCP config
    </a>{" "}
    (<code>~/.gemini/config/mcp_config.json</code> globally, or{" "}
    <code>.agents/mcp_config.json</code> for a single workspace):
  </>
);

export const CLIENTS: Client[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    Logo: ClaudeLogo,
    signIn: {
      lead: (
        <>
          Open <strong>Settings &gt; Connectors</strong>, click{" "}
          <strong>Add custom connector</strong>, name it Betterlytics and paste
          this URL:
        </>
      ),
      snippet: { lang: "text", code: (serverUrl) => serverUrl },
      after: (
        <>
          Click <strong>Add</strong>, then <strong>Connect</strong>.
        </>
      ),
    },
    token: {
      intro: (serverUrl) => (
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
            field: add a custom connector pointing at <code>{serverUrl}</code>{" "}
            with an <code>Authorization</code> header set to{" "}
            <code>Bearer &lt;your token&gt;</code>. That feature is still in
            beta and rolling out gradually, so if you don&apos;t see it, use the{" "}
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
          Open <strong>Settings &gt; Developer &gt; Edit Config</strong> to
          reveal <code>claude_desktop_config.json</code>, then add{" "}
          <code>betterlytics</code> to <code>mcpServers</code>:
        </>
      ),
      variants: [
        {
          label: "macOS / Linux",
          lang: "json",
          code: (input) =>
            mcpServersJson({
              command: "npx",
              args: ["-y", ...mcpRemoteArgs(input)],
            }),
        },
        {
          label: "Windows",
          note: (
            <>
              Claude Desktop spawns <code>npx.cmd</code> through{" "}
              <code>cmd.exe /C</code> without quoting the path, which breaks on
              the space in <code>C:\Program Files\nodejs\</code>. Invoke{" "}
              <code>cmd</code> yourself instead so it can resolve{" "}
              <code>npx</code> via PATH:
            </>
          ),
          lang: "json",
          code: (input) =>
            mcpServersJson({
              command: "cmd",
              args: ["/c", "npx", "-y", ...mcpRemoteArgs(input)],
            }),
        },
      ],
      outro: (
        <p>
          After saving, fully quit Claude Desktop (tray icon &gt; Quit on
          Windows, ⌘Q on macOS) and reopen it.
        </p>
      ),
    },
  },
  {
    id: "claude-code",
    name: "Claude Code",
    Logo: ClaudeLogo,
    signIn: {
      lead: (
        <>
          Run this in your project directory. Add <code>--scope user</code> to
          make it available across all your projects:
        </>
      ),
      snippet: {
        lang: "bash",
        code: (serverUrl) =>
          `claude mcp add --transport http ${SERVER_NAME} ${serverUrl}\nclaude mcp login ${SERVER_NAME}`,
      },
      after: (
        <>
          You can also sign in from inside Claude Code: run <code>/mcp</code>,
          pick <code>{SERVER_NAME}</code> and choose{" "}
          <strong>Authenticate</strong>.
        </>
      ),
    },
    token: {
      snippetLead: (
        <>
          Run this in your project directory. Add <code>--scope user</code> to
          make it available across all your projects:
        </>
      ),
      variants: [
        {
          label: "Terminal",
          lang: "bash",
          code: ({ token, serverUrl }) =>
            `claude mcp add --transport http ${SERVER_NAME} ${serverUrl} \\\n  --header "Authorization: Bearer ${token}"`,
        },
      ],
    },
  },
  {
    id: "cursor",
    name: "Cursor",
    Logo: CursorLogo,
    signIn: {
      install: {
        label: "Add to Cursor",
        href: (serverUrl) => cursorInstallLink({ url: serverUrl }),
      },
      lead: (
        <>
          Or add to <code>.cursor/mcp.json</code> in your project directory:
        </>
      ),
      snippet: {
        lang: "json",
        code: (serverUrl) => mcpServersJson({ url: serverUrl }),
      },
      after: (
        <>
          Then open <strong>Cursor Settings &gt; Tools &amp; MCP</strong> and
          sign in from the <code>{SERVER_NAME}</code> entry.
        </>
      ),
    },
    token: {
      install: {
        label: "Add to Cursor",
        href: (input) => cursorInstallLink(remoteConfig(input)),
        hintWithoutToken:
          "Opens Cursor with the server pre-filled. Paste your token above first and it installs ready to use.",
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
          code: (input) => mcpServersJson(remoteConfig(input)),
        },
      ],
    },
  },
  {
    id: "vs-code",
    name: "VS Code",
    Logo: VsCodeLogo,
    signIn: {
      install: { label: "Add to VS Code", href: vsCodeSignInInstallLink },
      lead: (
        <>
          Or add to <code>.vscode/mcp.json</code> in your project directory:
        </>
      ),
      snippet: {
        lang: "json",
        code: (serverUrl) =>
          JSON.stringify(
            { servers: { [SERVER_NAME]: { type: "http", url: serverUrl } } },
            null,
            2,
          ),
      },
      after: (
        <>
          When the server starts, VS Code asks to authenticate. Click{" "}
          <strong>Allow</strong>.
        </>
      ),
    },
    token: {
      install: {
        label: "Add to VS Code",
        href: vsCodeInstallLink,
        hintWithoutToken:
          "Opens VS Code and prompts you for your token, nothing else to fill in.",
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
          code: (input) =>
            JSON.stringify(
              {
                servers: {
                  [SERVER_NAME]: { type: "http", ...remoteConfig(input) },
                },
              },
              null,
              2,
            ),
        },
      ],
    },
  },
  {
    id: "windsurf",
    name: "Windsurf",
    Logo: WindsurfLogo,
    signIn: {
      lead: windsurfConfigLead,
      snippet: {
        lang: "json",
        code: (serverUrl) => mcpServersJson({ serverUrl }),
      },
      after: <>Windsurf opens the sign-in when it first connects.</>,
    },
    token: {
      snippetLead: windsurfConfigLead,
      variants: [
        {
          label: "mcp_config.json",
          lang: "json",
          code: ({ token, serverUrl }) =>
            mcpServersJson({
              serverUrl,
              headers: { Authorization: `Bearer ${token}` },
            }),
        },
      ],
    },
  },
  {
    id: "antigravity",
    name: "Antigravity",
    Logo: AntigravityLogo,
    signIn: {
      lead: antigravityConfigLead,
      snippet: {
        lang: "json",
        code: (serverUrl) => mcpServersJson({ serverUrl }),
      },
      after: <>Antigravity opens the sign-in when it first connects.</>,
    },
    token: {
      snippetLead: antigravityConfigLead,
      variants: [
        {
          label: "mcp_config.json",
          lang: "json",
          code: ({ token, serverUrl }) =>
            mcpServersJson({
              serverUrl,
              headers: { Authorization: `Bearer ${token}` },
            }),
        },
      ],
    },
  },
  {
    id: "codex",
    name: "Codex",
    Logo: CodexLogo,
    signIn: {
      lead: (
        <>
          Add to <code>~/.codex/config.toml</code>:
        </>
      ),
      snippet: {
        lang: "toml",
        code: (serverUrl) =>
          `[mcp_servers.${SERVER_NAME}]\nurl = "${serverUrl}"`,
      },
      after: (
        <>
          Then run <code>codex mcp login {SERVER_NAME}</code> in your terminal.
        </>
      ),
    },
    token: {
      snippetLead: (
        <>
          Add to <code>~/.codex/config.toml</code>:
        </>
      ),
      variants: [
        {
          label: "config.toml",
          lang: "toml",
          code: ({ token, serverUrl }) =>
            `[mcp_servers.${SERVER_NAME}]\nurl = "${serverUrl}"\nhttp_headers = { "Authorization" = "Bearer ${token}" }`,
        },
      ],
      outro: (
        <p>
          To keep the token out of the config file, drop the{" "}
          <code>http_headers</code> line and use{" "}
          <code>bearer_token_env_var = &quot;BETTERLYTICS_MCP_TOKEN&quot;</code>{" "}
          instead. Codex then reads the token from your environment at
          connection time.
        </p>
      ),
    },
  },
];

export const DEFAULT_CLIENT_ID = "claude-code";

export function isClientId(value: string | null | undefined): value is string {
  return !!value && CLIENTS.some((client) => client.id === value);
}
