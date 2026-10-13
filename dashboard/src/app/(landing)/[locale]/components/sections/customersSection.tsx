import { useTranslations } from 'next-intl';
import { Emphasis } from '@/landing/components/ui/emphasis';
import { Panel, Section } from '@/landing/components/ui/frame';
import { CUSTOMERS } from '@/landing/content/customers';
import { IDS } from '@/landing/lib/ids';
import { LogoBoard } from './logoBoard';

export function CustomersSection() {
  const t = useTranslations('landing.customers');
  if (CUSTOMERS.length === 0) return null;
  return (
    <Section id={IDS.customers} className='pt-0'>
      {/* no top rule on phones: the hero card above closes it */}
      <Panel flush className='max-sm:before:hidden'>
        <LogoBoard
          pool={CUSTOMERS}
          label={<Emphasis text={t('label')} as='em' className='font-medium text-volt-text not-italic' />}
        />
      </Panel>
    </Section>
  );
}
