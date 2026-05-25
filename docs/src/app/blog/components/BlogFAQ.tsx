type FaqItem = { q: string; a: string };

type Props = {
  items: FaqItem[];
  heading?: string;
};

export function BlogFAQ({ items, heading = "Frequently asked questions" }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className="not-prose mx-auto my-12 max-w-3xl">
      <h2 className="text-foreground text-2xl font-bold tracking-tight">
        {heading}
      </h2>
      <div className="border-border mt-6 divide-y overflow-hidden rounded-xl border">
        {items.map((item, i) => (
          <details
            key={i}
            className="group bg-card open:bg-muted/40 transition-colors"
          >
            <summary className="text-foreground flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
