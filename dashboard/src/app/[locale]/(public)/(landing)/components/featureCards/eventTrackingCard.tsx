import { EventLogEntry } from '@/entities/events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { EventLogItem } from '@/app/dashboard/[dashboardId]/events/EventLogItem';
import { getTranslations } from 'next-intl/server';

export default async function EventTrackingCard() {
  const t = await getTranslations('public.landing.cards.events');
  const mockEvents: EventLogEntry[] = [
    {
      event_name: 'Button Click',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      visitor_id: '',
      device_type: 'desktop',
      browser: 'chrome',
      country_code: 'US',
      url: 'https://example.com/landing-page',
      custom_event_json: JSON.stringify({ button_id: 'hero-cta', position: 'above-fold' }),
    },
    {
      event_name: 'Page View',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      visitor_id: '',
      device_type: 'mobile',
      browser: 'safari',
      country_code: 'CA',
      url: 'https://example.com/pricing',
      custom_event_json: JSON.stringify({ referrer: 'google.com' }),
    },
    {
      event_name: 'Form Submit',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      visitor_id: '',
      device_type: 'tablet',
      browser: 'firefox',
      country_code: 'GB',
      url: 'https://example.com/contact',
      custom_event_json: JSON.stringify({ form_type: 'contact', success: true }),
    },
    {
      event_name: 'Video Play',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      visitor_id: '',
      device_type: 'desktop',
      browser: 'edge',
      country_code: 'DE',
      url: 'https://example.com/features',
      custom_event_json: JSON.stringify({ video_id: 'demo-video', duration: 120 }),
    },
    {
      event_name: 'Download',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      visitor_id: '',
      device_type: 'mobile',
      browser: 'chrome',
      country_code: 'FR',
      url: 'https://example.com/resources',
      custom_event_json: JSON.stringify({ file_type: 'pdf', file_name: 'whitepaper.pdf' }),
    },
    {
      event_name: 'Search',
      timestamp: new Date(Date.now() - 18 * 60 * 1000),
      visitor_id: '',
      device_type: 'desktop',
      browser: 'safari',
      country_code: 'AU',
      url: 'https://example.com/search',
      custom_event_json: JSON.stringify({ query: 'analytics dashboard', results_count: 24 }),
    },
    {
      event_name: 'Newsletter Signup',
      timestamp: new Date(Date.now() - 22 * 60 * 1000),
      visitor_id: '',
      device_type: 'mobile',
      browser: 'firefox',
      country_code: 'JP',
      url: 'https://example.com/blog',
      custom_event_json: JSON.stringify({ source: 'blog-footer', email_domain: 'gmail.com' }),
    },
    {
      event_name: 'Add to Cart',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      visitor_id: '',
      device_type: 'tablet',
      browser: 'chrome',
      country_code: 'BR',
      url: 'https://example.com/shop',
      custom_event_json: JSON.stringify({ product_id: 'analytics-pro', price: 99 }),
    },
  ];

  const LiveIndicator = () => (
    <div className='absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-lg shadow-green-500/50'>
      <div className='absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-400' />
    </div>
  );

  return (
    <Card className='dark:metric-card dark:shadow-card-glow relative overflow-hidden'>
      <CardHeader className='pb-0'>
        <CardTitle className='flex items-center gap-3 text-xl'>
          <div className='bg-muted/50 border-border/30 relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border'>
            <Clock className='text-primary h-4 w-4' />
            <LiveIndicator />
          </div>
          {t('title')}
        </CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='p-0'>
        <ScrollArea className='h-64'>
          <div className='divide-border/60 divide-y'>
            {mockEvents.map((event, index) => (
              <EventLogItem key={`${event.timestamp}-${index}`} event={event} />
            ))}
          </div>
        </ScrollArea>

        <div className='border-border/60 mt-4 border-t pt-3'>
          <div className='text-muted-foreground text-center text-xs'>
            {t('showing', { loaded: 8, total: 1247 })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
