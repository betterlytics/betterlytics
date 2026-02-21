import Link from "next/link";

interface DashboardSectionCardProps {
  title: string;
  description: string;
  href: string;
}

export function DashboardSectionCard({
  title,
  description,
  href,
}: DashboardSectionCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 transition-all duration-200 hover:border-[color:var(--primary)] hover:-translate-y-0.5"
    >
      <h3 className="text-base font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)] leading-relaxed">
        {description}
      </p>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg
          className="h-4 w-4 text-[color:var(--primary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
