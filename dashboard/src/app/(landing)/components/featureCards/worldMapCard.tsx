import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/LeafletMap';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { MOCK_WORLD_GEOVISITORS } from '@/constants/geographyData';

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

        <div className='border-border/60 border-t pt-3'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>Top Countries</span>
            <div className='flex items-center gap-5'>
              {MOCK_WORLD_GEOVISITORS.slice(0, 3).map((country) => (
                <div key={country.country_code} className='flex items-center gap-1'>
                  <FlagIcon countryCode={country.country_code as FlagIconProps['countryCode']} />
                  <span className='text-xs font-medium'>
                    {country.country_code}: {country.visitors}
                  </span>
                  <span className='bg-primary/60 inline-block h-2 w-2 rounded-full'></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
