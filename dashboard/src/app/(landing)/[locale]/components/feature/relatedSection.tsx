import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, Section } from '@/landing/components/ui/frame';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import styles from './relatedSection.module.css';

export type RelatedItem = {
  key: 'analytics' | 'replay' | 'errors' | 'vitals';
  icon: ReactNode;
  href: string;
};

const RELATED_ID = 'related';

/** Siblings of the feature, keyed under `landing.feature.relatedItems`. */
export function RelatedSection({ items }: { items: RelatedItem[] }) {
  const t = useTranslations('landing.feature');
  return (
    <Section id={RELATED_ID} title={t('related.title')} lede={t('related.lede')}>
      <Panel flush>
        <SpotlightList className='grid grid-cols-4 max-xl:grid-cols-2 max-sm:-mx-(--pad) max-sm:grid-cols-1'>
          {items.map((item) => (
            <li key={item.key} className={styles.card}>
              <a
                href={item.href}
                className='relative flex h-full flex-col px-6.5 pt-6.5 pb-6 outline-hidden focus-visible:inset-ring-[1.5px] focus-visible:inset-ring-volt-soft/70 max-sm:px-(--pad)'
              >
                <span className='mb-9 grid size-9 place-items-center rounded-[9px] border border-rule-10 bg-fg/5 text-fg'>
                  {item.icon}
                </span>
                <span className='text-title leading-6 font-medium tracking-ui'>
                  {t(`relatedItems.${item.key}.title`)}
                </span>
                <span className='mt-1.5 mb-7 text-label leading-[21px] text-muted'>
                  {t(`relatedItems.${item.key}.body`)}
                </span>
                <span className='mt-auto inline-flex items-center gap-1.5 text-label text-volt-text'>
                  {t('related.learnMore')}
                  <ArrowRight className={`${styles.arrow} size-3.5`} aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </SpotlightList>
      </Panel>
    </Section>
  );
}
