"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "../../components/logo";
import ExternalLink from "@/shared/ExternalLink";
import { GitHubIcon } from "../../components/SocialIcons";

export function BlogTopBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/blog"
              className="flex items-center space-x-2"
              onClick={closeMobileMenu}
              aria-label="Betterlytics blog"
            >
              <Logo variant="icon" showText textSize="md" priority />
            </Link>
          </div>

          <div className="hidden items-center md:flex">
            <nav className="flex items-center space-x-6">
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Documentation
              </Link>
              <ExternalLink
                href="https://betterlytics.io/features"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Features
              </ExternalLink>
              <ExternalLink
                href="https://betterlytics.io/pricing"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Pricing
              </ExternalLink>
            </nav>

            <div className="ml-6 flex items-center gap-4">
              <ExternalLink
                href="https://github.com/betterlytics/betterlytics"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon className="h-5 w-5" />
              </ExternalLink>
              <div className="flex items-center gap-2">
                <ExternalLink
                  href="https://betterlytics.io/signin"
                  className="border-border text-foreground hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                >
                  Log in
                </ExternalLink>
                <ExternalLink
                  href="https://betterlytics.io/signup"
                  className="bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-opacity"
                >
                  Get Started
                </ExternalLink>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              className="flex items-center justify-center p-2"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t md:hidden">
            <nav className="space-y-3 py-4">
              <Link
                href="/docs"
                onClick={closeMobileMenu}
                className="text-foreground hover:text-foreground block text-sm font-medium transition-colors"
              >
                Documentation
              </Link>
              <ExternalLink
                href="https://betterlytics.io/features"
                onClick={closeMobileMenu}
                className="text-foreground hover:text-foreground block text-sm font-medium transition-colors"
              >
                Features
              </ExternalLink>
              <ExternalLink
                href="https://betterlytics.io/pricing"
                onClick={closeMobileMenu}
                className="text-foreground hover:text-foreground block text-sm font-medium transition-colors"
              >
                Pricing
              </ExternalLink>
              <ExternalLink
                href="https://github.com/betterlytics/betterlytics"
                onClick={closeMobileMenu}
                className="text-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors"
                title="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon className="mr-2 h-4 w-4" />
                GitHub
              </ExternalLink>

              <div className="border-t pt-3">
                <div className="flex flex-col gap-2">
                  <ExternalLink
                    href="https://betterlytics.io/signup"
                    onClick={closeMobileMenu}
                    className="bg-primary text-primary-foreground hover:opacity-90 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-opacity"
                  >
                    Get Started
                  </ExternalLink>
                  <ExternalLink
                    href="https://betterlytics.io/signin"
                    onClick={closeMobileMenu}
                    className="border-border text-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Log in
                  </ExternalLink>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
