import Link from "next/link";
import type { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  href: string;
  children: ReactNode;
}

export function FeatureCard({ title, href, children }: FeatureCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 transition-all duration-200 hover:border-[color:var(--primary)]">
      <h3 className="text-base font-semibold">
        {/* Stretched link: makes the whole card navigate to href, while the
            z-raised links in the body stay individually clickable. */}
        <Link
          href={href}
          className="text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--primary)] after:absolute after:inset-0 after:content-['']"
        >
          {title}
        </Link>
      </h3>
      <div className="mt-1.5 text-sm leading-relaxed text-[color:var(--muted-foreground)] [&_a]:relative [&_a]:z-10 [&_a]:font-medium [&_a]:text-[color:var(--foreground)] [&_a]:underline [&_a]:decoration-[color:var(--border)] [&_a]:underline-offset-2 [&_a:hover]:text-[color:var(--primary)]">
        {children}
      </div>
    </div>
  );
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  );
}
