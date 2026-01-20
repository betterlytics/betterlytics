'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Package, ChevronRight, ChevronDown, Menu, X, ArrowUpRight, Copy, Check } from 'lucide-react';
import ThemeToggleFab from '@/components/ThemeToggleFab';
import Logo from '@/components/logo';

export interface ComponentConfig {
  name: string;
  slug: string;
  packageName: string;
  npmUrl: string;
  githubUrl: string;
  description: string;
  version?: string;
}

export interface ComponentDocLayoutProps {
  children: React.ReactNode;
  config: ComponentConfig;
  documentation?: React.ReactNode;
}

const COMPONENTS: ComponentConfig[] = [
  {
    name: 'Gauge',
    slug: 'gauge',
    packageName: 'react-gauge',
    npmUrl: 'https://www.npmjs.com/package/react-gauge',
    githubUrl: 'https://github.com/betterlytics/betterlytics',
    description: 'Lightweight animated gauge with pure CSS animations',
  },
  {
    name: 'NumberRoll',
    slug: 'react-number-roll',
    packageName: 'react-number-roll',
    npmUrl: 'https://www.npmjs.com/package/react-number-roll',
    githubUrl: 'https://github.com/betterlytics/betterlytics',
    description: 'Animated number display with Intl formatting using pure CSS',
  },
];

function QuickInstall({ packageName }: { packageName: string }) {
  const [copied, setCopied] = useState(false);
  const command = `npm i ${packageName}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted"
    >
      <span className="text-primary/70">$</span>
      <span>{command}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export default function ComponentDocLayout({
  children,
  config,
  documentation
}: ComponentDocLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [componentDropdownOpen, setComponentDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo & Breadcrumb with Component Dropdown */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
            >
              <Logo variant="icon" showText textSize="sm" />
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />

            {/* Component Dropdown */}
            <div className="relative">
              <button
                onClick={() => setComponentDropdownOpen(!componentDropdownOpen)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span>{config.name}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${componentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {componentDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setComponentDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-1 min-w-[220px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div className="p-1.5">
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Components
                      </div>
                      {COMPONENTS.map((comp) => {
                        const isActive = pathname.includes(`/components/${comp.slug}`);
                        return (
                          <Link
                            key={comp.slug}
                            href={`/components/${comp.slug}`}
                            onClick={() => setComponentDropdownOpen(false)}
                            className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <span className="text-sm font-medium">{comp.name}</span>
                            <span className="text-xs text-muted-foreground">{comp.packageName}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <QuickInstall packageName={config.packageName} />
            </div>
            <a
              href={config.npmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
              aria-label="View on npm"
            >
              <Package className="h-4 w-4" />
            </a>
            <a
              href={config.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
              aria-label="View on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {COMPONENTS.map((comp) => {
                const isActive = pathname.includes(`/components/${comp.slug}`);
                return (
                  <Link
                    key={comp.slug}
                    href={`/components/${comp.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {comp.name}
                    <span className="ml-2 text-xs text-muted-foreground">{comp.description}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-border/40">
              <QuickInstall packageName={config.packageName} />
            </div>
          </div>
        )}
      </header>

      {/* Component Hero */}
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {config.name}
                </h1>
                {config.version && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    v{config.version}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {config.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={config.npmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-accent"
              >
                <Package className="h-4 w-4" />
                npm
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </a>
              <a
                href={config.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-accent"
              >
                <Github className="h-4 w-4" />
                Source
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Demo Section */}
        <div className="mb-16">
          {children}
        </div>

        {/* Documentation Section */}
        {documentation && (
          <div className="border-t border-border/40 pt-16">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground">Documentation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Learn how to install and use the {config.name} component in your project.
              </p>
            </div>
            {documentation}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Built with care by{' '}
              <a
                href="https://betterlytics.io"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Betterlytics
              </a>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/betterlytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://npmjs.com/org/betterlytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                npm
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ThemeToggleFab />
    </div>
  );
}

export { COMPONENTS };
