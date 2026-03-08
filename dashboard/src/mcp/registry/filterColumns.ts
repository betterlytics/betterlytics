import { type FilterColumn } from '@/entities/analytics/filter.entities';

const FILTER_COLUMN_DESCRIPTIONS: Record<FilterColumn, string> = {
  url: 'Page URL path',
  domain: 'Site domain',
  device_type: 'Device type (desktop, mobile, tablet)',
  country_code: 'Two-letter ISO country code',
  browser: 'Browser name',
  os: 'Operating system',
  referrer_source: 'Traffic source type (e.g. search, social, direct)',
  referrer_source_name: 'Traffic source name (e.g. Google, Twitter)',
  referrer_search_term: 'Search term used to reach the site',
  referrer_url: 'Full referrer URL',
  utm_source: 'UTM source parameter',
  utm_medium: 'UTM medium parameter',
  utm_campaign: 'UTM campaign parameter',
  utm_term: 'UTM term parameter',
  utm_content: 'UTM content parameter',
  event_type: 'Event type (pageview, custom, outbound_link)',
  custom_event_name: 'Name of custom event',
};

export function getFilterColumnDescription(column: FilterColumn): string {
  return FILTER_COLUMN_DESCRIPTIONS[column];
}
