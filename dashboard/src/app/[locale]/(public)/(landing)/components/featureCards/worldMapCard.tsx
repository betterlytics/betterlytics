import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/map/LeafletMap';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { MOCK_WORLD_GEOVISITORS, MOCK_COMPARE_GEOVISITORS } from '@/constants/geographyData';
import type { GeoVisitor } from '@/entities/analytics/geography.entities';
import { getLocale, getTranslations } from 'next-intl/server';
import { SupportedLanguages } from '@/constants/i18n';
import { getCountryName } from '@/utils/countryCodes';

const CountryCol = ({ geoVisitor, locale }: { geoVisitor: GeoVisitor; locale: SupportedLanguages }) => (
  <div className='flex py-2 text-xs' key={geoVisitor.country_code}>
    <div className='flex items-center gap-0.75'>
      <FlagIcon
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <span className='font-medium'>{geoVisitor.country_code}</span>
    </div>
    <span className='text-muted-foreground ml-1 flex items-center'>{geoVisitor.visitors}</span>
  </div>
);

export default async function WorldMapCard() {
  const t = await getTranslations('public.landing.cards.worldMap');
  const locale = await getLocale();

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className='border-border/30 h-64 w-full overflow-hidden rounded-lg border'>
          <LeafletMap
            visitorData={MOCK_WORLD_GEOVISITORS}
            compareData={MOCK_COMPARE_GEOVISITORS}
            maxVisitors={MOCK_WORLD_GEOVISITORS[0]?.visitors}
            showZoomControls={false}
            showLegend={false}
            initialZoom={1}
          />
        </div>

        <div className='pt-2'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>{t('topCountries')}</span>
            <div className='grid auto-cols-[70px] grid-flow-col justify-end gap-3 overflow-hidden pr-1'>
              {Array.from({ length: 2 }).map((_, i) => (
                <CountryCol
                  key={MOCK_WORLD_GEOVISITORS[i].country_code}
                  geoVisitor={MOCK_WORLD_GEOVISITORS[i]}
                  locale={locale as SupportedLanguages}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
