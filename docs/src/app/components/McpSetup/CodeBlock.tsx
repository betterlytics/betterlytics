"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../../../lib/utils";
import type { SnippetLang } from "./clients";

type Kind =
  | "plain"
  | "key"
  | "string"
  | "punct"
  | "literal"
  | "command"
  | "flag";

type Piece = { text: string; kind: Kind };

const KIND_CLASS: Record<Kind, string> = {
  plain: "",
  key: "text-sky-700 dark:text-sky-300",
  string: "text-emerald-700 dark:text-emerald-300",
  punct: "text-neutral-500 dark:text-neutral-400",
  literal: "text-amber-700 dark:text-amber-300",
  command: "text-violet-700 dark:text-violet-300",
  flag: "text-sky-700 dark:text-sky-300",
};

function scan(
  code: string,
  pattern: RegExp,
  classify: (match: RegExpExecArray) => Kind,
): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > last) {
      pieces.push({ text: code.slice(last, match.index), kind: "plain" });
    }
    pieces.push({ text: match[0], kind: classify(match) });
    last = match.index + match[0].length;
  }
  if (last < code.length) {
    pieces.push({ text: code.slice(last), kind: "plain" });
  }
  return pieces;
}

function tokenizeJson(code: string): Piece[] {
  const pattern = /"(?:[^"\\]|\\.)*"|[{}[\],:]|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?/g;
  return scan(code, pattern, (match) => {
    const value = match[0];
    if (value.startsWith('"')) {
      const rest = code.slice(match.index + value.length);
      return /^\s*:/.test(rest) ? "key" : "string";
    }
    return /^[{}[\],:]$/.test(value) ? "punct" : "literal";
  });
}

function tokenizeToml(code: string): Piece[] {
  const pattern = /^\[[^\]\n]+\]|"(?:[^"\\]|\\.)*"|^[A-Za-z_][\w-]*(?=\s*=)|[={},]/gm;
  return scan(code, pattern, (match) => {
    const value = match[0];
    if (value.startsWith("[")) return "key";
    if (value.startsWith('"')) return "string";
    return /^[={},]$/.test(value) ? "punct" : "key";
  });
}

function tokenizeBash(code: string): Piece[] {
  const pattern = /^[\w-]+|"(?:[^"\\]|\\.)*"|--?[\w-]+|\\$/gm;
  return scan(code, pattern, (match) => {
    const value = match[0];
    if (value.startsWith('"')) return "string";
    if (value.startsWith("-")) return "flag";
    if (value === "\\") return "punct";
    return match.index === 0 ? "command" : "plain";
  });
}

const TOKENIZERS: Record<SnippetLang, (code: string) => Piece[]> = {
  json: tokenizeJson,
  toml: tokenizeToml,
  bash: tokenizeBash,
};

/** Splits pieces so the reader's own token can be visibly marked in place. */
function markSubstring(pieces: Piece[], needle: string) {
  if (!needle) return pieces.map((piece) => ({ ...piece, marked: false }));

  return pieces.flatMap((piece) => {
    const parts = piece.text.split(needle);
    if (parts.length === 1) return [{ ...piece, marked: false }];

    return parts.flatMap((part, index) =>
      index === 0
        ? [{ text: part, kind: piece.kind, marked: false }]
        : [
            { text: needle, kind: piece.kind, marked: true },
            { text: part, kind: piece.kind, marked: false },
          ],
    );
  });
}

type CodeBlockProps = {
  code: string;
  lang: SnippetLang;
  /** Substring to visually mark, used for the reader's pasted token. */
  mark?: string;
};

export function CodeBlock({ code, lang, mark }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const pieces = useMemo(
    () => markSubstring(TOKENIZERS[lang](code), mark ?? ""),
    [code, lang, mark],
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard is unavailable (insecure context, denied permission) — the
      // snippet is selectable, so there is nothing useful to surface here.
    }
  }, [code]);

  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--muted)] py-3 pl-4 pr-14 text-[0.8125rem] leading-relaxed">
        <code className="font-mono">
          {pieces.map((piece, index) => (
            <span
              key={index}
              className={cn(
                KIND_CLASS[piece.kind],
                piece.marked &&
                  "rounded-sm bg-[color:var(--primary)]/15 ring-1 ring-[color:var(--primary)]/30",
              )}
            >
              {piece.text}
            </span>
          ))}
        </code>
      </pre>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-2 top-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-1.5 text-[color:var(--muted-foreground)] opacity-0 transition hover:text-[color:var(--foreground)] focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
      >
        {copied ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-[color:var(--primary)]"
            aria-hidden="true"
          >
            <path d="m20 6-11 11-5-5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
