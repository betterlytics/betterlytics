"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { CodeBlock } from "./CodeBlock";
import {
  CLIENTS,
  DEFAULT_CLIENT_ID,
  TOKEN_PLACEHOLDER,
  isClientId,
} from "./clients";

const STORAGE_KEY = "betterlytics.docs.mcp-client";

const PROSE = cn(
  "text-[color:var(--foreground)]",
  "[&_p]:mt-4 [&_p]:leading-7 [&_p:first-child]:mt-0",
  "[&_a]:text-[color:var(--primary)] [&_a]:underline [&_a]:underline-offset-2",
  "[&_code]:rounded-md [&_code]:border [&_code]:border-[color:var(--border)] [&_code]:bg-[color:var(--muted)] [&_code]:px-[.25em] [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[.9em]",
);

function clientIdFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  return isClientId(hash) ? hash : null;
}

export function McpSetup() {
  const [selectedId, setSelectedId] = useState(DEFAULT_CLIENT_ID);
  const [variantIndex, setVariantIndex] = useState(0);
  const [token, setToken] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = useMemo(
    () => CLIENTS.find((client) => client.id === selectedId) ?? CLIENTS[0],
    [selectedId],
  );
  const variant = selected.variants[variantIndex] ?? selected.variants[0];

  const trimmedToken = token.trim();
  const hasToken = trimmedToken.length > 0;
  const effectiveToken = hasToken ? trimmedToken : TOKEN_PLACEHOLDER;

  const select = useCallback((id: string, fromUser = true) => {
    setSelectedId(id);
    setVariantIndex(0);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
    }
    if (fromUser) {
      // Keeps the per-client anchor shareable without triggering a scroll jump.
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  // A legacy `#cursor`-style anchor wins over the remembered client, so shared
  // links always land on the client they were shared for.
  useEffect(() => {
    const fromHash = clientIdFromHash();
    if (fromHash) {
      select(fromHash, false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isClientId(stored)) select(stored, false);
    } catch {
      // See above.
    }
  }, [select]);

  useEffect(() => {
    const onHashChange = () => {
      const fromHash = clientIdFromHash();
      if (fromHash) select(fromHash, false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [select]);

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + CLIENTS.length) % CLIENTS.length;
    select(CLIENTS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="my-6">
      {CLIENTS.map((client) => (
        <span
          key={client.id}
          id={client.id}
          className="block scroll-mt-24"
          aria-hidden="true"
        />
      ))}

      <div
        role="tablist"
        aria-label="MCP client"
        className="flex flex-wrap gap-2"
      >
        {CLIENTS.map((client, index) => {
          const isSelected = client.id === selected.id;
          return (
            <button
              key={client.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="mcp-setup-panel"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(client.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={cn(
                "flex w-[5.75rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]",
                isSelected
                  ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--foreground)]"
                  : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:border-[color:var(--primary)]/40 hover:bg-[color:var(--accent)] hover:text-[color:var(--foreground)]",
              )}
            >
              <client.Logo className="h-6 w-6 shrink-0 text-[color:var(--foreground)]" />
              <span className="text-xs font-medium leading-tight">
                {client.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <label
          htmlFor="mcp-token"
          className="block text-sm font-medium text-[color:var(--foreground)]"
        >
          Your token{" "}
          <span className="font-normal text-[color:var(--muted-foreground)]">
            (optional)
          </span>
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="mcp-token"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={TOKEN_PLACEHOLDER}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full min-w-0 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 font-mono text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)] focus:outline-none"
          />
          {hasToken && (
            <button
              type="button"
              onClick={() => setToken("")}
              className="shrink-0 cursor-pointer rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
          Paste it to get ready-to-use snippets and install links. It is
          substituted in your browser only — never sent to us and never saved.
        </p>
      </div>

      <div
        id="mcp-setup-panel"
        role="tabpanel"
        aria-label={`${selected.name} setup`}
        className="mt-6"
      >
        {selected.intro && (
          <div className={cn(PROSE, "text-sm")}>{selected.intro}</div>
        )}

        {selected.install && (
          <div className="mt-4">
            <a
              href={selected.install.href(effectiveToken)}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] no-underline transition-opacity hover:opacity-90"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 11 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {selected.install.label}
            </a>
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
              {hasToken
                ? "Pre-filled with the token above — click to install."
                : selected.install.hintWithoutToken}
            </p>
          </div>
        )}

        <div className={cn(PROSE, "mt-5 text-sm")}>
          <p>{selected.snippetLead}</p>
        </div>

        {selected.variants.length > 1 && (
          <div className="mt-3 inline-flex rounded-lg border border-[color:var(--border)] p-0.5">
            {selected.variants.map((option, index) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setVariantIndex(index)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  index === variantIndex
                    ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {variant.note && (
          <div className={cn(PROSE, "mt-3 text-sm")}>
            <p>{variant.note}</p>
          </div>
        )}

        <div className="mt-3">
          <CodeBlock
            code={variant.code(effectiveToken)}
            lang={variant.lang}
            mark={hasToken ? trimmedToken : undefined}
          />
        </div>

        {!hasToken && (
          <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
            Replace{" "}
            <code className="rounded border border-[color:var(--border)] bg-[color:var(--muted)] px-1 py-0.5 font-mono">
              {TOKEN_PLACEHOLDER}
            </code>{" "}
            with the token you copied, or paste it above to fill it in for you.
          </p>
        )}

        {selected.outro && (
          <div className={cn(PROSE, "mt-4 text-sm")}>{selected.outro}</div>
        )}
      </div>
    </div>
  );
}
