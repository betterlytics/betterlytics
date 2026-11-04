import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundPage } from "nextra-theme-docs";
import { InkedNumerals } from "./components/notFound/InkedNumerals";

export const metadata: Metadata = { title: "Page Not Found" };

/* the last child is Nextra's report link: muted, so its link blue doesn't sit next to the primary button */
export default function NotFound() {
  return (
    <NotFoundPage
      content="Report this broken link"
      labels="documentation"
      className="[&>a:last-child]:text-muted-foreground [&>a:last-child:hover]:text-foreground"
    >
      <h1 className="sr-only">Page Not Found</h1>
      <InkedNumerals className="w-[min(88%,680px)] [--numeral-ink:var(--primary)] [--numeral-lens:var(--primary)] [--numeral-tint:var(--primary)] dark:[--numeral-ink:color-mix(in_oklch,var(--primary),white_30%)] dark:[--numeral-lens:color-mix(in_oklch,var(--primary),white_50%)]" />
      <p className="mt-10 max-w-[44ch] text-center text-lg text-balance">
        This link leads nowhere. The page may have moved, or the address has a
        typo.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-7 inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium shadow-xs transition-colors"
      >
        Back to the docs
      </Link>
    </NotFoundPage>
  );
}
