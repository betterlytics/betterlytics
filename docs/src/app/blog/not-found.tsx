import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Blog-level 404: `notFound()` from a post route lands here, inside the blog
// layout, rather than on the app-wide not-found page.
export default function BlogNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-5 py-24">
      <h1 className="text-2xl font-semibold">Post not found</h1>
      <p className="text-muted-foreground text-sm">
        This post doesn&apos;t exist, or it hasn&apos;t been published yet.
      </p>
      <Link
        href="/blog"
        className="border-border text-foreground hover:bg-muted mt-2 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All posts
      </Link>
    </div>
  );
}
