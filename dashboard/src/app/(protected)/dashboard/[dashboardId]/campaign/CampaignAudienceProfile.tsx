'use client';

import { memo, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { BrowserIcon, DeviceIcon, FlagIcon, OSIcon, type FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { useTranslations } from 'next-intl';
import { capitalizeFirstLetter } from '@/utils/formatters';

export type AudienceShare = {
  label: string;
  value: string;
};

export type CampaignAudienceProfileProps = {
  devices?: AudienceShare[];
  countries?: AudienceShare[];
  browsers?: AudienceShare[];
  operatingSystems?: AudienceShare[];
};

const CampaignAudienceProfile = memo(
  ({ devices, countries, browsers, operatingSystems }: CampaignAudienceProfileProps) => {
    const locale = useLocale();
    const t = useTranslations('components.campaign.audienceProfile');
    const sections = useMemo(
      () =>
        [
          { key: 'devices', title: t('deviceTitle'), items: devices ?? [] },
          { key: 'browsers', title: t('browserTitle'), items: browsers ?? [] },
          { key: 'os', title: t('osTitle'), items: operatingSystems ?? [] },
          { key: 'countries', title: t('countryTitle'), items: countries ?? [] },
        ].filter((section) => section.items.length > 0),
      [devices, browsers, operatingSystems, countries],
    );

    if (sections.length === 0) {
      return (
        <div className='text-muted-foreground flex items-center justify-center px-1 py-2 text-xs'>
          {t('noData')}
        </div>
      );
    }

    return (
      <section aria-label='Audience profile' className='px-2 pt-3 pb-3'>
        <p className='text-foreground mb-1 text-sm leading-tight font-medium'>{t('title')}</p>
        <div className='grid grid-cols-2 gap-x-4 gap-y-3 pt-2.5 md:grid-cols-4'>
          {sections.map((section) => (
            <div key={section.key} className='space-y-1.5'>
              <p className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
                {section.title}
              </p>
              <div className='space-y-1'>
                {section.items.map((item) => {
                  const { icon, label } = getAudienceIconAndLabel(section.key, item.label, locale);
                  return (
                    <div
                      key={item.label}
                      className='text-muted-foreground flex items-center justify-between text-xs'
                    >
                      <div className='flex min-w-0 items-center gap-1.5 overflow-hidden'>
                        {icon}
                        <span className='block max-w-[7.5rem] truncate'>{label}</span>
                      </div>
                      <span className='text-foreground ml-2 shrink-0 font-medium tabular-nums'>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  },
);

CampaignAudienceProfile.displayName = 'CampaignAudienceProfile';

export default CampaignAudienceProfile;

function getAudienceIconAndLabel(sectionKey: string, rawLabel: string, locale: string) {
  switch (sectionKey) {
    case 'devices':
      return {
        icon: <DeviceIcon type={rawLabel} className='h-3.5 w-3.5' />,
        label: capitalizeFirstLetter(rawLabel),
      };
    case 'browsers':
      return {
        icon: <BrowserIcon name={rawLabel} className='h-3.5 w-3.5' />,
        label: rawLabel,
      };
    case 'os':
      return {
        icon: <OSIcon name={rawLabel} className='h-3.5 w-3.5' />,
        label: rawLabel,
      };
    case 'countries': {
      const code = rawLabel.toUpperCase() as FlagIconProps['countryCode'];
      const name = getCountryName(code, locale as Parameters<typeof getCountryName>[1]);
      return {
        icon: <FlagIcon countryCode={code} countryName={name} />,
        label: name,
      };
    }
    default:
      return {
        icon: null,
        label: rawLabel,
      };
  }
}
