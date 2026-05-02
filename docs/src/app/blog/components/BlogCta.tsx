import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function BlogCta({ href, children, variant = "primary" }: Props) {
  const isExternal = /^https?:\/\//.test(href);

  const className = cn(
    "not-prose inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-opacity",
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "border-border text-foreground hover:bg-muted border"
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
