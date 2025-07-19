import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LeafletMap from '@/components/LeafletMap';
import { GeoVisitor } from '@/entities/geography';

export default function WorldMapCard() {
  const mockGeographyData: GeoVisitor[] = [
    { country_code: 'USA', visitors: 1247 },
    { country_code: 'GBR', visitors: 892 },
    { country_code: 'DNK', visitors: 743 },
    { country_code: 'FRA', visitors: 621 },
    { country_code: 'CAN', visitors: 534 },
    { country_code: 'AUS', visitors: 398 },
    { country_code: 'JPN', visitors: 287 },
    { country_code: 'BRA', visitors: 234 },
    { country_code: 'IND', visitors: 198 },
    { country_code: 'ESP', visitors: 156 },
    { country_code: 'ITA', visitors: 134 },
    { country_code: 'NLD', visitors: 98 },
    { country_code: 'SWE', visitors: 67 },
    { country_code: 'NOR', visitors: 45 },
  ];

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
          {/* <LeafletMap
            visitorData={mockGeographyData}
            showZoomControls={false}
            showLegend={false}
            initialZoom={1}
            maxVisitors={1247}
          /> */}
        </div>

        <div className='border-border/60 border-t pt-3'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>Top Countries</span>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1'>
                <div className='bg-primary h-2 w-2 rounded-full'></div>
                <span className='text-xs font-medium'>US: 1,247</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='bg-primary/60 h-2 w-2 rounded-full'></div>
                <span className='text-xs font-medium'>GB: 892</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
