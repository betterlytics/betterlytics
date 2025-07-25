import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/LeafletMap';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { MOCK_WORLD_GEOVISITORS } from '@/constants/geographyData';
import { alpha2ToAlpha3Code } from '@/utils/countryCodes';

export default function WorldMapCard() {
  const getLegendCountryRow = (firstIdx: number = 0, lastIdx?: number) => (
    <div className='my-[6px] grid grid-cols-4 gap-x-[9px] px-0.5'>
      {MOCK_WORLD_GEOVISITORS.slice(firstIdx, lastIdx)
        // .reverse() // since we are using grid layout, we reverse the order to match left to right
        .map((country) => (
          <div className='space-between text-xxs flex w-full overflow-hidden pl-[2px]' key={country.country_code}>
            <div className='flex items-center gap-0.75'>
              <FlagIcon countryCode={country.country_code as FlagIconProps['countryCode']} />
              <span className='font-medium'>{alpha2ToAlpha3Code(country.country_code)}</span>
            </div>
            <span className='text-muted-foreground ml-auto flex items-center'>{country.visitors}</span>
          </div>
        ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>Geographical Analytics</CardTitle>
        <CardDescription className='text-base'>
          See where your visitors are coming from around the world.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-3'>
        <div className='border-border/30 h-64 w-full overflow-hidden rounded-lg border'>
          <LeafletMap
            visitorData={MOCK_WORLD_GEOVISITORS}
            showZoomControls={false}
            showLegend={false}
            initialZoom={1}
            maxVisitors={MOCK_WORLD_GEOVISITORS[0]?.visitors}
          />
        </div>

        <div className='flex items-center justify-between gap-0.5'>
          <span className='text-muted-foreground max-w-16 pr-0.5 text-center text-xs'>Top Countries</span>

          <div className='flex w-full flex-col'>
            {getLegendCountryRow(0, 4)}
            <div className='col-span-4 h-[0.1px] border-[0.5px] shadow' />
            {getLegendCountryRow(4, 8)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
