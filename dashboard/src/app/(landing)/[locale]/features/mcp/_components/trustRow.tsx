import { useTranslations } from 'next-intl';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';

const ITEMS = ['read', 'scope', 'revoke'] as const;

export function TrustRow() {
  const t = useTranslations('landing.mcpServer.setup.trust');
  return (
    <ul className={cn(ruled.grid, ruled.cols3, 'border-t border-rule-10 max-sm:mx-0')}>
      {ITEMS.map((key) => (
        <li key={key} className='px-6 pt-5.5 pb-6 transition-ink max-sm:px-4'>
          <p className='text-label leading-5 font-medium tracking-ui'>{t(`${key}.title`)}</p>
          <p className='mt-1.5 max-w-[34ch] text-label leading-[21px] text-pretty text-muted'>
            {t(`${key}.body`)}
          </p>
        </li>
      ))}
    </ul>
  );
}
