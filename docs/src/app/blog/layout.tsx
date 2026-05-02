import Link from "next/link";
import { Footer } from "../components/footer";
import Logo from "../components/logo";
import ExternalLink from "@/shared/ExternalLink";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="flex items-center gap-2"
            aria-label="Betterlytics blog"
          >
            <Logo
              variant="simple"
              showText
              textSize="sm"
              width={28}
              height={28}
              priority
            />
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <ExternalLink
              href="https://betterlytics.io/features"
              className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 transition-colors sm:inline-flex"
            >
              Features
            </ExternalLink>
            <ExternalLink
              href="https://betterlytics.io/pricing"
              className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 transition-colors sm:inline-flex"
            >
              Pricing
            </ExternalLink>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 transition-colors sm:inline-flex"
            >
              Docs
            </Link>
            <ExternalLink
              href="https://betterlytics.io/dashboards"
              className="bg-primary text-primary-foreground hover:opacity-90 ml-1 inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-opacity"
            >
              To Dashboard
            </ExternalLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
