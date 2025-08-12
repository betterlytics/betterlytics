import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ExternalLink } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';

export default async function TrafficSourcesCard() {
  const trafficSources = [
    {
      name: 'Google Search',
      visitors: 3247,
      percentage: 42.8,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500'>
          <span className='text-xs font-bold text-white'>G</span>
        </div>
      ),
      color: 'bg-blue-500',
    },
    {
      name: 'Direct',
      visitors: 1834,
      percentage: 24.2,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-600'>
          <Globe className='h-3 w-3 text-white' />
        </div>
      ),
      color: 'bg-gray-600',
    },
    {
      name: 'Social Media',
      visitors: 1456,
      percentage: 19.2,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-pink-500'>
          <span className='text-xs font-bold text-white'>S</span>
        </div>
      ),
      color: 'bg-pink-500',
    },
    {
      name: 'Email',
      visitors: 678,
      percentage: 8.9,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
          <span className='text-xs font-bold text-white'>@</span>
        </div>
      ),
      color: 'bg-green-500',
    },
    {
      name: 'Other',
      visitors: 365,
      percentage: 4.9,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-orange-500'>
          <ExternalLink className='h-3 w-3 text-white' />
        </div>
      ),
      color: 'bg-orange-500',
    },
  ];

  const SourceItem = ({ source }: { source: (typeof trafficSources)[0] }) => (
    <div className='flex items-center justify-between space-x-3'>
      <div className='flex items-center space-x-3'>
        {source.icon}
        <div>
          <div className='text-sm font-medium'>{source.name}</div>
          <div className='text-muted-foreground text-xs'>{source.visitors.toLocaleString()} visitors</div>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <span className='text-sm font-medium'>{formatPercentage(source.percentage)}</span>
        <div className='bg-muted h-2 w-16 overflow-hidden rounded-full'>
          <div
            className={`h-full ${source.color}`}
            style={{ width: `${formatPercentage(Math.min(source.percentage * 2, 100))}` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-xl'>Traffic Sources</CardTitle>
        <CardDescription className='text-base'>
          Discover where your visitors are arriving from and optimize your marketing efforts.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          {trafficSources.map((source) => (
            <SourceItem key={source.name} source={source} />
          ))}
        </div>

        <div className='border-border/60 border-t pt-3'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>Total Visitors</span>
            <div className='text-primary flex items-center'>
              <span className='font-medium'>7,580 this month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
