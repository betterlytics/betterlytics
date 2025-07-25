import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/LeafletMap';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { MOCK_WORLD_GEOVISITORS } from '@/constants/geographyData';

const LegendCountryRow = ({ firstIdx = 0, lastIdx }: { firstIdx?: number; lastIdx?: number }) => {
  const CountryRow = ({ country }: { country: (typeof MOCK_WORLD_GEOVISITORS)[number] }) => (
    <div className='text-xxs flex w-full flex-col overflow-hidden px-1.5 py-[6px]' key={country.country_code}>
      <div className='flex items-center gap-0.75'>
        <FlagIcon countryCode={country.country_code as FlagIconProps['countryCode']} />
        <span className='font-medium'>{country.country_code}</span>
      </div>
      <span className='text-muted-foreground ml-auto flex items-center'>{country.visitors}</span>
    </div>
  );

  return (
    <div className='grid grid-cols-4 divide-x divide-gray-300'>
      {MOCK_WORLD_GEOVISITORS.slice(firstIdx, lastIdx).map((country) => (
        <CountryRow key={country.country_code} country={country} />
      ))}
    </div>
  );
};

export default function WorldMapCard() {
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

        <div className='mt-1 flex items-center justify-between gap-0.5'>
          <span className='text-muted-foreground max-w-16 pr-0.5 text-center text-xs'>Top Countries</span>
          <div className='flex w-full flex-col'>
            <LegendCountryRow firstIdx={0} lastIdx={4} />
            <div className='col-span-4 h-[0.1px] border-[0.5px] shadow' />
            <LegendCountryRow firstIdx={4} lastIdx={8} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
