import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { Panel, Section } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { LogoBoard } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/logoBoard';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { CUSTOMERS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/customers';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

/** Monochrome logo wall. Still unless there are more teams than slots, in which case one cell at a time flips. */
export function CustomersSection() {
  return (
    <Section id={IDS.customers} className='sec--tight'>
      <Panel flush>
        <LogoBoard
          pool={CUSTOMERS}
          label={
            <span>
              <Emphasis text={COPY.customers.label} wrap={(span) => <em>{span}</em>} />
            </span>
          }
        />
      </Panel>
    </Section>
  );
}
