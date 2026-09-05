import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { Panel, Section } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { PathIcon } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/pathIcon';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { CUSTOMERS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/customers';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

/** Static, monochrome logo wall. The marquees further down are the only scrolling rows. */
export function CustomersSection() {
  return (
    <Section id={IDS.customers} className='sec--tight'>
      <Panel flush>
        <div className='logos'>
          <div className='logos__label'>
            <span>
              <Emphasis text={COPY.customers.label} wrap={(span) => <em>{span}</em>} />
            </span>
          </div>
          {CUSTOMERS.map((logo) => (
            <span key={logo.name} className={cn('lg', logo.style && `lg--${logo.style}`)}>
              <PathIcon icon={logo.icon} className='lgico' />
              <b>{logo.name}</b>
            </span>
          ))}
        </div>
      </Panel>
    </Section>
  );
}
