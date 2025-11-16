import { EventLogEntry } from '@/entities/events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  Download,
  FileText,
  Mail,
  MousePointerClick,
  PlayCircle,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { EventLogItem } from '@/components/events/EventLogItem';
import { getTranslations } from 'next-intl/server';

export default async function EventTrackingCard() {
  const t = await getTranslations('public.landing.cards.events');
  const mockEvents: Array<{ event: EventLogEntry; icon: LucideIcon }> = [
    {
      event: {
        event_name: 'Button Click',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        visitor_id: '',
        device_type: 'desktop',
        browser: 'chrome',
        country_code: 'US',
        url: 'https://example.com/landing-page',
        custom_event_json: JSON.stringify({ button_id: 'hero-cta' }),
      },
      icon: MousePointerClick,
    },
    {
      event: {
        event_name: 'Form Submit',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        visitor_id: '',
        device_type: 'tablet',
        browser: 'firefox',
        country_code: 'GB',
        url: 'https://example.com/contact',
        custom_event_json: JSON.stringify({ form_type: 'contact', success: true }),
      },
      icon: FileText,
    },
    {
      event: {
        event_name: 'Video Play',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        visitor_id: '',
        device_type: 'desktop',
        browser: 'edge',
        country_code: 'DE',
        url: 'https://example.com/features',
        custom_event_json: JSON.stringify({ video_id: 'demo-video', duration: 120 }),
      },
      icon: PlayCircle,
    },
    {
      event: {
        event_name: 'Download',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        visitor_id: '',
        device_type: 'mobile',
        browser: 'chrome',
        country_code: 'FR',
        url: 'https://example.com/resources',
        custom_event_json: JSON.stringify({ file_name: 'whitepaper.pdf' }),
      },
      icon: Download,
    },
    {
      event: {
        event_name: 'Search',
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        visitor_id: '',
        device_type: 'desktop',
        browser: 'safari',
        country_code: 'AU',
        url: 'https://example.com/search',
        custom_event_json: JSON.stringify({ query: 'Betterlytics', results_count: 24 }),
      },
      icon: Search,
    },
    {
      event: {
        event_name: 'Newsletter Signup',
        timestamp: new Date(Date.now() - 22 * 60 * 1000),
        visitor_id: '',
        device_type: 'mobile',
        browser: 'firefox',
        country_code: 'JP',
        url: 'https://example.com/blog',
        custom_event_json: JSON.stringify({ source: 'blog-footer' }),
      },
      icon: Mail,
    },
    {
      event: {
        event_name: 'Add to Cart',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        visitor_id: '',
        device_type: 'tablet',
        browser: 'chrome',
        country_code: 'BR',
        url: 'https://example.com/shop',
        custom_event_json: JSON.stringify({ product_id: 'analytics-pro', price: 99 }),
      },
      icon: ShoppingCart,
    },
  ];

  const LiveIndicator = () => (
    <div className='absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-lg shadow-green-500/50'>
      <div className='absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-400' />
    </div>
  );

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 overflow-hidden border pb-3 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""] supports-[backdrop-filter]:backdrop-blur-[2px]'>
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

      <CardContent className='flex flex-col p-0'>
        {/* For mobile we just show top 2 items to avoid disruptive scroll */}
        <div className='sm:hidden'>
          <div className='divide-border/60 divide-y'>
            {mockEvents.slice(0, 2).map(({ event, icon }, index) => (
              <EventLogItem key={`${event.timestamp}-${index}`} event={event} icon={icon} />
            ))}
          </div>
        </div>
        <ScrollArea className='hidden max-h-[320px] sm:block sm:max-h-[360px]'>
          <div className='divide-border/60 divide-y'>
            {mockEvents.map(({ event, icon }, index) => (
              <EventLogItem key={`${event.timestamp}-${index}`} event={event} icon={icon} />
            ))}
          </div>
        </ScrollArea>

        <div className='border-border/60 border-t px-6 pt-3'>
          <div className='text-muted-foreground text-center text-xs sm:hidden'>
            {t('showing', { loaded: 2, total: 1247 })}
          </div>
          <div className='text-muted-foreground hidden text-center text-xs sm:block'>
            {t('showing', { loaded: 7, total: 1247 })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
