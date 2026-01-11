import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className='group border-border/50 bg-card/40 hover:border-border/80 hover:bg-card/60 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

      <div className='relative'>
        <div className='border-border/40 bg-background/50 text-muted-foreground mb-4 inline-flex rounded-lg border p-2.5 transition-colors duration-300 group-hover:border-blue-500/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'>
          <Icon className='h-5 w-5' />
        </div>

        <h3 className='mb-2 text-lg font-semibold tracking-tight'>{title}</h3>
        <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
      </div>
    </div>
  );
}
