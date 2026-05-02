export function BlogIndexHero() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">
          Articles
        </div>
        <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
          The Betterlytics blog
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
          Notes on privacy-first analytics, GDPR, and what we&apos;re building.
        </p>
      </div>
    </section>
  );
}
