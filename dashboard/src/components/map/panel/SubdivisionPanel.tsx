'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import type { FlagIconProps } from '@/components/icons';
import { TrendPercentage } from '@/components/TrendPercentage';
import SubdivisionMapSection from '@/components/map/panel/SubdivisionMapSection';
import type { SubdivisionDrilldownController } from '@/components/map/panel/use-subdivision-drilldown';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { getCountryName } from '@/utils/countryCodes';
import { formatNumber } from '@/utils/formatters';
import { calculatePercentageChange } from '@/utils/percentageChange';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

export default function SubdivisionPanel({ drilldown }: { drilldown: SubdivisionDrilldownController }) {
  const { countryCode, close } = drilldown;
  const [displayCountry, setDisplayCountry] = useState(countryCode);
  // The last country stays mounted through the close animation
  if (countryCode && countryCode !== displayCountry) setDisplayCountry(countryCode);
  const locale = useLocale();

  if (!displayCountry) return null;

  const countryName = getCountryName(displayCountry, locale);

  return (
    <Dialog open={!!countryCode} onOpenChange={(isOpen) => !isOpen && close()} modal={false}>
      <DialogContent
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className='data-[state=closed]:slide-out-to-right-8 data-[state=open]:slide-in-from-right-8 top-auto right-4 bottom-4 left-auto z-20 flex max-h-[70vh] w-[400px] max-w-[calc(100vw-2rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-md border-0 bg-card p-0 shadow-md dark:bg-(--card-interactive)'
      >
        <div className='flex flex-col gap-1 border-b p-4'>
          <DialogTitle>
            <CountryDisplay
              countryCode={displayCountry as FlagIconProps['countryCode']}
              countryName={countryName}
            />
          </DialogTitle>
          <CountryTotal countryCode={displayCountry} />
        </div>
        <SubdivisionMapSection countryCode={displayCountry} />
      </DialogContent>
    </Dialog>
  );
}

function CountryTotal({ countryCode }: { countryCode: string }) {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.worldMap.useQuery(input, options);
  const { compareMode } = useTimeRangeContext();
  const locale = useLocale();
  const t = useTranslations('components.geography');

  const visitors = query.data?.visitorData.find((d) => d.code === countryCode)?.visitors ?? 0;
  const compareVisitors = query.data?.compareData.find((d) => d.code === countryCode)?.visitors ?? 0;
  const percentageChange = compareMode === 'off' ? undefined : calculatePercentageChange(visitors, compareVisitors);

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='text-muted-foreground'>{t('visitors')}:</span>
      <span>{formatNumber(visitors, locale)}</span>
      {percentageChange !== undefined && (
        <TrendPercentage percentage={percentageChange} withParenthesis withIcon locale={locale} />
      )}
    </div>
  );
}
