import { PlanBadge } from '@/components/billing/PlanBadge';
import type { PlanDefinition } from '@/lib/billing/catalog';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** The plan that unlocks this section, shown as a badge next to the title. */
  upgradePlan?: PlanDefinition | null;
  headerExtra?: React.ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
  upgradePlan,
  headerExtra,
}: SettingsSectionProps) {
  return (
    <section className='space-y-4'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <h2 className='text-md flex items-center gap-2 font-semibold'>
            {title}
            {upgradePlan && <PlanBadge plan={upgradePlan} />}
          </h2>
          {description && <p className='text-muted-foreground text-sm'>{description}</p>}
        </div>
        {headerExtra}
      </div>

      <div className='bg-card space-y-6 rounded-md border p-3'>{children}</div>
    </section>
  );
}
