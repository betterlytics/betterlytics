import { type FilterColumn, type TableFilterColumn, parseFilterColumn } from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';

const STANDARD_COLUMN_DESCRIPTIONS: Record<TableFilterColumn, string> = {
  url: 'Page URL path',
  domain: 'Site domain',
  device_type: 'Device type (desktop, mobile, tablet)',
  country_code: 'Two-letter ISO country code',
  subdivision_code: 'ISO 3166-2 subdivision (state/province) code',
  city: 'City name',
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
  outbound_link_url: 'URL clicked when leaving the site via an outbound link',
};

const PROPERTY_SOURCE_DESCRIPTIONS: Record<PropertySourceKind, string> = {
  gp: 'Global property',
  cep: 'Custom event property',
};

export function getFilterColumnDescription(column: FilterColumn): string {
  const parsed = parseFilterColumn(column);
  if (parsed.kind === 'property') {
    return `${PROPERTY_SOURCE_DESCRIPTIONS[parsed.source]}: ${parsed.key}`;
  }
  return STANDARD_COLUMN_DESCRIPTIONS[parsed.col];
}
