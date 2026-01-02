'use client';

import { memo, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { BrowserIcon, DeviceIcon, FlagIcon, OSIcon, type FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { useTranslations } from 'next-intl';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { Text } from '@/components/text';
import { Grid, Stack } from '@/components/layout';

export type AudienceShare = {
  label: string;
  value: string;
};

export type CampaignAudienceProfileProps = {
  devices: AudienceShare[];
  countries: AudienceShare[];
  browsers: AudienceShare[];
  operatingSystems: AudienceShare[];
};

const CampaignAudienceProfile = memo(
  ({ devices, countries, browsers, operatingSystems }: CampaignAudienceProfileProps) => {
    const locale = useLocale();
    const t = useTranslations('components.campaign.audienceProfile');
    const sections = useMemo(
      () =>
        [
          { key: 'devices', title: t('deviceTitle'), items: devices },
          { key: 'browsers', title: t('browserTitle'), items: browsers },
          { key: 'os', title: t('osTitle'), items: operatingSystems },
          { key: 'countries', title: t('countryTitle'), items: countries },
        ].filter((section) => section.items.length > 0),
      [devices, browsers, operatingSystems, countries],
    );

    if (sections.length === 0) {
      return (
        <Text variant='caption' className='flex items-center justify-center px-1 py-2'>
          {t('noData')}
        </Text>
      );
    }

    return (
      <Stack aria-label='Audience profile' gap='content-sm'>
        <Text variant='body' as='p' className='mb-1 leading-tight font-medium'>
          {t('title')}
        </Text>
        <Grid cols={{ base: 2, xl: 4 }} gap='content-lg' className='gap-x-content-xl'>
          {sections.map((section) => (
            <Stack key={section.key} gap='content-md'>
              <Text variant='column-header'>{section.title}</Text>
              <Stack gap='content-sm'>
                {section.items.map((item) => {
                  const { icon, label } = getAudienceIconAndLabel(section.key, item.label, locale);
                  return (
                    <div
                      key={item.label}
                      className='text-muted-foreground flex items-center justify-between text-xs'
                    >
                      <div className='flex min-w-0 items-center gap-1.5 overflow-hidden'>
                        {icon}
                        <Text variant='body-sm' truncate className='block max-w-[7.5rem]'>
                          {label}
                        </Text>
                      </div>
                      <Text variant='value-xs' className='ml-2 shrink-0'>
                        {item.value}
                      </Text>
                    </div>
                  );
                })}
              </Stack>
            </Stack>
          ))}
        </Grid>
      </Stack>
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
