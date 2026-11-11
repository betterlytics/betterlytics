import { EyeIcon, KeyRound, ShieldCheck, SquareStack } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';

const ITEMS = [
  { key: 'read', icon: EyeIcon },
  { key: 'scope', icon: SquareStack },
  { key: 'revoke', icon: KeyRound },
  { key: 'privacy', icon: ShieldCheck },
] as const;

export function TrustRow() {
  const t = useTranslations('landing.mcpServer.setup.trust');
  return (
    <ul className={cn(ruled.grid, ruled.cols4, 'border-t border-rule-10 max-sm:mx-0')}>
      {ITEMS.map(({ key, icon: Icon }) => (
        <li key={key} className='px-6 pt-5.5 pb-6 transition-ink max-sm:px-4'>
          <p className='flex items-center gap-2 text-label leading-5 font-medium tracking-ui'>
            <Icon className='size-3.5 text-muted' aria-hidden />
            {t(`${key}.title`)}
          </p>
          <p className='mt-1.5 max-w-[34ch] text-label leading-[21px] text-pretty text-muted'>
            {t(`${key}.body`)}
          </p>
        </li>
      ))}
    </ul>
  );
}
