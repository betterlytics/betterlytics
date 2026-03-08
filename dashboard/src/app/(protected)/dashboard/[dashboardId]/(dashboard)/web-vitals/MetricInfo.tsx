'use client';

import { InfoTooltip } from '@/components/ui-extended/InfoTooltip';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { formatCWV } from '@/utils/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { useLocale, useTranslations } from 'next-intl';

type MetricInfoProps = {
  metric: CoreWebVitalName;
  iconClassName?: string;
  triggerClassName?: string;
};

export default function MetricInfo({ metric, iconClassName = 'h-4 w-4', triggerClassName }: MetricInfoProps) {
  const t = useTranslations('components.webVitals');
  const locale = useLocale();
  return (
    <InfoTooltip
      iconClassName={iconClassName}
      triggerClassName={triggerClassName}
      ariaLabel={t('info.aboutMetricAria')}
    >
      <InfoTooltip.Description>{t(`info.descriptions.${metric}`)}</InfoTooltip.Description>
      <InfoTooltip.Secondary>
        <div>
          <span className='opacity-80'>{t('info.good')}:</span> ≤ {formatCWV(metric, CWV_THRESHOLDS[metric][0], locale)}
        </div>
        <div>
          <span className='opacity-80'>{t('info.fair')}:</span> ≤ {formatCWV(metric, CWV_THRESHOLDS[metric][1], locale)}
        </div>
      </InfoTooltip.Secondary>
    </InfoTooltip>
  );
}
