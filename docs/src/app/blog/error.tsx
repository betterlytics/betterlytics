"use client";

import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";

// Blog-level error boundary: keeps a failure in a post (bad MDX, broken
// component) inside /blog instead of bubbling to the app-wide error page.
export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-5 py-24">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t render this page. The rest of the blog is unaffected —
        try again, or head back to the index.
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
        <Link
          href="/blog"
          className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All posts
        </Link>
      </div>
    </div>
  );
}
