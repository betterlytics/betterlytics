import type { ComponentType } from 'react';
import { Link } from '@/i18n/navigation';

interface FeatureCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
}

export function FeatureCard({ icon: Icon, title, description, href }: FeatureCardProps) {
  return (
    <div className='group has-[a:focus-visible]:ring-ring/50 border-border/50 bg-card/40 hover:border-border/80 hover:bg-card/60 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 has-[a:focus-visible]:ring-[3px] dark:hover:shadow-blue-500/10'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

      <div className='relative'>
        <div className='border-border/40 bg-background/50 text-muted-foreground mb-4 inline-flex rounded-lg border p-2.5 transition-colors duration-300 group-hover:border-blue-500/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'>
          <Icon className='h-5 w-5' />
        </div>

        <h3 className='mb-2 text-lg font-semibold tracking-tight'>
          {href ? (
            <Link href={href} prefetch={false} className='outline-none after:absolute after:-inset-6'>
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
      </div>
    </div>
  );
}
