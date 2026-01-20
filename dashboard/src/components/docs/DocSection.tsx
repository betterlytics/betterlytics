'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, Copy, Check, Terminal, FileCode } from 'lucide-react';

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function DocSection({ title, children, defaultOpen = true, icon }: DocSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg py-3 text-left group hover:bg-muted/30 transition-colors -mx-2 px-2"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighter for TSX/TypeScript
function highlightCode(code: string, language: string): React.ReactNode[] {
  const keywords = [
    'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'default', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof',
    'class', 'extends', 'implements', 'interface', 'type', 'enum', 'async', 'await',
    'true', 'false', 'null', 'undefined', 'this', 'super', 'static', 'readonly',
    'public', 'private', 'protected', 'as', 'is', 'in', 'of',
  ];

  const reactKeywords = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext'];
  const components = ['NumberRoll', 'Gauge', 'Segment'];

  const lines = code.split('\n');

  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // String literals (single, double, template)
      const stringMatch = remaining.match(/^(['"`])(?:(?!\1)[^\\]|\\.)*?\1/);
      if (stringMatch) {
        tokens.push(
          <span key={key++} className="text-emerald-600 dark:text-emerald-400">
            {stringMatch[0]}
          </span>
        );
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Comments
      const commentMatch = remaining.match(/^\/\/.*/);
      if (commentMatch) {
        tokens.push(
          <span key={key++} className="text-muted-foreground/60 italic">
            {commentMatch[0]}
          </span>
        );
        remaining = remaining.slice(commentMatch[0].length);
        continue;
      }

      // JSX tags
      const jsxOpenMatch = remaining.match(/^<\/?([A-Z][a-zA-Z0-9]*)/);
      if (jsxOpenMatch) {
        tokens.push(
          <span key={key++}>
            <span className="text-muted-foreground">&lt;</span>
            {remaining.startsWith('</') && <span className="text-muted-foreground">/</span>}
            <span className="text-sky-600 dark:text-sky-400">{jsxOpenMatch[1]}</span>
          </span>
        );
        remaining = remaining.slice(jsxOpenMatch[0].length);
        continue;
      }

      // HTML-like tags
      const htmlTagMatch = remaining.match(/^<\/?([a-z][a-z0-9]*)/);
      if (htmlTagMatch) {
        tokens.push(
          <span key={key++}>
            <span className="text-muted-foreground">&lt;</span>
            {remaining.startsWith('</') && <span className="text-muted-foreground">/</span>}
            <span className="text-rose-600 dark:text-rose-400">{htmlTagMatch[1]}</span>
          </span>
        );
        remaining = remaining.slice(htmlTagMatch[0].length);
        continue;
      }

      // Closing tag bracket or self-closing
      const closingMatch = remaining.match(/^\s*\/?>/);
      if (closingMatch) {
        tokens.push(
          <span key={key++} className="text-muted-foreground">
            {closingMatch[0]}
          </span>
        );
        remaining = remaining.slice(closingMatch[0].length);
        continue;
      }

      // Numbers
      const numberMatch = remaining.match(/^\b\d+(\.\d+)?\b/);
      if (numberMatch) {
        tokens.push(
          <span key={key++} className="text-amber-600 dark:text-amber-400">
            {numberMatch[0]}
          </span>
        );
        remaining = remaining.slice(numberMatch[0].length);
        continue;
      }

      // Keywords and identifiers
      const wordMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        let className = 'text-foreground';

        if (keywords.includes(word)) {
          className = 'text-violet-600 dark:text-violet-400 font-medium';
        } else if (reactKeywords.includes(word)) {
          className = 'text-cyan-600 dark:text-cyan-400';
        } else if (components.includes(word)) {
          className = 'text-sky-600 dark:text-sky-400';
        } else if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
          // PascalCase - likely a type or component
          className = 'text-sky-600 dark:text-sky-400';
        }

        tokens.push(
          <span key={key++} className={className}>
            {word}
          </span>
        );
        remaining = remaining.slice(word.length);
        continue;
      }

      // Props/attributes (word followed by =)
      const propMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?==)/);
      if (propMatch) {
        tokens.push(
          <span key={key++} className="text-sky-700 dark:text-sky-300">
            {propMatch[1]}
          </span>
        );
        remaining = remaining.slice(propMatch[1].length);
        continue;
      }

      // Operators and punctuation
      const opMatch = remaining.match(/^[{}[\]()=<>:;,.|&!?+\-*/%@#^~`\\]+/);
      if (opMatch) {
        tokens.push(
          <span key={key++} className="text-muted-foreground">
            {opMatch[0]}
          </span>
        );
        remaining = remaining.slice(opMatch[0].length);
        continue;
      }

      // Whitespace
      const wsMatch = remaining.match(/^\s+/);
      if (wsMatch) {
        tokens.push(<span key={key++}>{wsMatch[0]}</span>);
        remaining = remaining.slice(wsMatch[0].length);
        continue;
      }

      // Fallback: single character
      tokens.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <span key={lineIndex}>
        {tokens}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    );
  });
}

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'tsx', filename, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);
  const lineCount = code.split('\n').length;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-[#fafafa] dark:bg-[#0d0d0d]">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{filename}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
          </div>
        </div>
      )}
      <div className="relative">
        <div className="overflow-x-auto">
          <pre className="p-4 text-[13px] leading-relaxed">
            {showLineNumbers && (
              <span className="select-none pr-4 text-muted-foreground/40">
                {Array.from({ length: lineCount }, (_, i) => (
                  <span key={i} className="block text-right">
                    {i + 1}
                  </span>
                ))}
              </span>
            )}
            <code className="font-mono">{highlighted}</code>
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:bg-accent hover:text-accent-foreground focus:opacity-100 group-hover:opacity-100"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface InstallBlockProps {
  packageName: string;
}

export function InstallBlock({ packageName }: InstallBlockProps) {
  const [manager, setManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun'>('npm');
  const [copied, setCopied] = useState(false);

  const commands = {
    npm: `npm install ${packageName}`,
    pnpm: `pnpm add ${packageName}`,
    yarn: `yarn add ${packageName}`,
    bun: `bun add ${packageName}`,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands[manager]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-[#fafafa] dark:bg-[#0d0d0d] transition-all hover:border-primary/20">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Installation</span>
        </div>
        <div className="flex gap-1 rounded-lg bg-background/50 p-0.5" role="tablist" aria-label="Package manager">
          {(['npm', 'pnpm', 'yarn', 'bun'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setManager(m)}
              role="tab"
              aria-selected={manager === m}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                manager === m
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex items-center">
        <div className="flex items-center gap-3 flex-1 overflow-x-auto p-4">
          <span className="select-none text-emerald-500 dark:text-emerald-400">$</span>
          <pre className="text-[13px]">
            <code className="font-mono text-foreground">{commands[manager]}</code>
          </pre>
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : 'Copy command'}
          className="mr-3 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface PropTableProps {
  props: {
    name: string;
    type: string;
    default?: string;
    description: string;
    required?: boolean;
  }[];
}

export function PropTable({ props }: PropTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prop
              </th>
              <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </th>
              <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Default
              </th>
              <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {props.map((prop, index) => (
              <tr
                key={prop.name}
                className="group bg-card transition-colors hover:bg-muted/20"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-center gap-2">
                    <code className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary">
                      {prop.name}
                    </code>
                    {prop.required && (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        Required
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-violet-600 dark:text-violet-400">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-3.5 align-top">
                  {prop.default ? (
                    <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      {prop.default}
                    </code>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 align-top text-sm text-muted-foreground leading-relaxed">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        {icon && (
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
        <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Tab navigation component for documentation
interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface DocTabsProps {
  tabs: TabItem[];
  defaultTab?: number;
}

export function DocTabs({ tabs, defaultTab = 0 }: DocTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex border-b border-border bg-muted/30" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={activeTab === index}
            onClick={() => setActiveTab(index)}
            className={`relative px-4 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset ${
              activeTab === index
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {activeTab === index && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="p-4" role="tabpanel">
        {tabs[activeTab].content}
      </div>
    </div>
  );
}

// Callout/Note component
interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-300',
    tip: 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-300',
    danger: 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300',
  };

  const icons = {
    info: '💡',
    warning: '⚠️',
    tip: '✨',
    danger: '🚨',
  };

  return (
    <div className={`rounded-xl border-l-4 ${styles[type]} p-4`} role="note">
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">{icons[type]}</span>
        <div className="flex-1">
          {title && <p className="mb-1 font-semibold">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
