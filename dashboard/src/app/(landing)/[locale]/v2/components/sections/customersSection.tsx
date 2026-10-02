import { Emphasis } from '@/landing/components/ui/emphasis';
import { Panel, Section } from '@/landing/components/ui/frame';
import { COPY } from '@/landing/content/copy';
import { CUSTOMERS } from '@/landing/content/customers';
import { IDS } from '@/landing/lib/ids';
import { LogoBoard } from './logoBoard';

/** Monochrome logo wall. Still unless there are more teams than slots, in which case one cell at a time flips. */
export function CustomersSection() {
  return (
    <Section id={IDS.customers} className='pt-0'>
      {/* no top rule on phones: the hero card just above closes it */}
      <Panel flush className='max-sm:before:hidden'>
        <LogoBoard
          pool={CUSTOMERS}
          label={
            <Emphasis text={COPY.customers.label} as='em' className='font-medium text-volt-text not-italic' />
          }
        />
      </Panel>
    </Section>
  );
}
