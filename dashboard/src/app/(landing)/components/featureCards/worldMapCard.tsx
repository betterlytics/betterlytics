import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/LeafletMap';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { MOCK_WORLD_GEOVISITORS } from '@/constants/geographyData';
import { GeoVisitor } from '@/entities/geography';

const CountryCol = ({ geoVisitor }: { geoVisitor: GeoVisitor }) => (
  <div className='flex py-2 text-xs' key={geoVisitor.country_code}>
    <div className='flex items-center gap-0.75'>
      <FlagIcon countryCode={geoVisitor.country_code as FlagIconProps['countryCode']} />
      <span className='font-medium'>{geoVisitor.country_code}</span>
    </div>
    <span className='text-muted-foreground ml-1 flex items-center'>{geoVisitor.visitors}</span>
  </div>
);

export default function WorldMapCard() {
  return (
    <Card>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>Geographical Analytics</CardTitle>
        <CardDescription className='text-base'>
          See where your visitors are coming from around the world.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
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
            <div className='grid auto-cols-[70px] grid-flow-col justify-end gap-1 overflow-hidden'>
              {Array.from({ length: 2 }).map((_, i) => (
                <CountryCol key={MOCK_WORLD_GEOVISITORS[i].country_code} geoVisitor={MOCK_WORLD_GEOVISITORS[i]} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
