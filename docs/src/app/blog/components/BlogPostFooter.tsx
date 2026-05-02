import Link from "next/link";
import { type BlogPost } from "../lib/registry";

type Props = {
  post: BlogPost;
};

export function BlogPostFooter({ post }: Props) {
  const { citations } = post.frontmatter;

  return (
    <footer className="mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      {citations.length > 0 && (
        <section className="border-border border-t pt-8">
          <h2 className="text-foreground text-xl font-semibold">Sources</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {citations.map((c) => (
              <li key={c.url} className="text-muted-foreground">
                <a
                  href={c.url}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="bg-card border-border mt-12 overflow-hidden rounded-2xl border p-8 sm:p-10">
        <h2 className="text-foreground text-2xl font-bold tracking-tight">
          Try Betterlytics free
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Privacy-first, cookieless analytics with session replay, error
          tracking, and uptime monitoring in one dashboard. EU-hosted on Hetzner.
          Free up to 10,000 events per month.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-opacity"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/pricing"
            className="border-border text-foreground hover:bg-muted inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            See pricing
          </Link>
        </div>
      </section>

      <div className="mt-10 text-sm">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to all posts
        </Link>
      </div>
    </footer>
  );
}
