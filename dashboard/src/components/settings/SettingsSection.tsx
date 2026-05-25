import { ProBadge } from '@/components/billing/ProBadge';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  pro?: boolean;
  headerExtra?: React.ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
  pro,
  headerExtra,
}: SettingsSectionProps) {
  return (
    <section className='space-y-4'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <h2 className='text-md flex items-center gap-2 font-semibold'>
            {title}
            {pro && <ProBadge />}
          </h2>
          {description && <p className='text-muted-foreground text-sm'>{description}</p>}
        </div>
        {headerExtra}
      </div>

      <div className='bg-card space-y-6 rounded-md border p-3'>{children}</div>
    </section>
  );
}
