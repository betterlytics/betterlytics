import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLink } from '@/landing/components/ui/appLink';
import { Panel, Section } from '@/landing/components/ui/frame';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import { cn } from '@/landing/lib/cn';
import styles from './relatedSection.module.css';

export type RelatedItem = {
  key: 'analytics' | 'replay' | 'errors' | 'vitals' | 'uptime';
  icon: ReactNode;
  href: string;
};

const RELATED_ID = 'related';

export function RelatedSection({ items, lede }: { items: RelatedItem[]; lede: string }) {
  const t = useTranslations('landing.feature');
  return (
    <Section id={RELATED_ID} title={t('related.title')} lede={lede}>
      <Panel flush>
        <SpotlightList className={cn(ruled.grid, ruled.cols4)}>
          {items.map((item) => (
            <li key={item.key} className={styles.card}>
              <AppLink
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
              </AppLink>
            </li>
          ))}
        </SpotlightList>
      </Panel>
    </Section>
  );
}
