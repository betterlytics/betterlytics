import ExternalLink from "@/shared/ExternalLink";
import Logo from "./logo";
import Link from "next/link";
import { GitHubIcon, BlueskyIcon, DiscordIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="border-border/40 border-t py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div>
            <div className="mb-4">
              <Logo variant="icon" showText textSize="md" priority />
            </div>
            <p className="text-muted-foreground mb-6 text-sm">
              Privacy-first web analytics for the modern web. GDPR compliant,
              cookieless, and open source.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <ExternalLink
                  href="https://betterlytics.io/about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/dpa"
                  className="hover:text-foreground transition-colors"
                >
                  Data Processing Agreement
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/subprocessors"
                  className="hover:text-foreground transition-colors"
                >
                  Subprocessors
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/changelog"
                  className="hover:text-foreground transition-colors"
                >
                  Changelog
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Compare</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/google-analytics"
                  className="hover:text-foreground transition-colors"
                >
                  vs Google Analytics
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/matomo"
                  className="hover:text-foreground transition-colors"
                >
                  vs Matomo
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/plausible"
                  className="hover:text-foreground transition-colors"
                >
                  vs Plausible
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/posthog"
                  className="hover:text-foreground transition-colors"
                >
                  vs PostHog
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/fathom-analytics"
                  className="hover:text-foreground transition-colors"
                >
                  vs Fathom Analytics
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://betterlytics.io/vs/umami"
                  className="hover:text-foreground transition-colors"
                >
                  vs Umami
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Connect</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <ExternalLink
                  href="https://github.com/betterlytics/betterlytics"
                  className="hover:text-foreground flex items-center transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon className="mr-2 h-4 w-4" />
                  GitHub
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://bsky.app/profile/betterlytics.bsky.social"
                  className="hover:text-foreground flex items-center transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BlueskyIcon className="mr-2 h-4 w-4" />
                  Bluesky
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href="https://discord.com/invite/vwqSvPn6sP"
                  className="hover:text-foreground flex items-center transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  Discord
                </ExternalLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-border/40 mt-8 border-t pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Betterlytics. Open source under
            AGPL-3.0 license.
          </p>
        </div>
      </div>
    </footer>
  );
}
