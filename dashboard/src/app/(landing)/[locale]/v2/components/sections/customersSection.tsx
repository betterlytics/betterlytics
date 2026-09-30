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
      <Panel flush>
        <LogoBoard
          pool={CUSTOMERS}
          label={
            <Emphasis
              text={COPY.customers.label}
              // between the pale accent and the underline blue: the claim should carry, and the
              // underline blue reads too dark as a word on canvas
              wrap={(span) => <em className='font-medium text-[#6b7aff] not-italic'>{span}</em>}
            />
          }
        />
      </Panel>
    </Section>
  );
}
