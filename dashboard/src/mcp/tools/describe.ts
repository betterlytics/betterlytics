import { METRICS } from '@/mcp/registry/metrics';
import { DIMENSIONS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { MCP_TIME_RANGES, MCP_GRANULARITIES } from '@/mcp/query-builder/validation';

const FILTER_COLUMN_DESCRIPTIONS: Record<string, string> = {
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

export function getSchemaDescription() {
  return {
    metrics: METRICS.map((m) => ({ key: m.key, description: m.description })),
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, description: d.description })),
    filterColumns: FILTER_COLUMNS.map((col) => ({
      key: col,
      description: FILTER_COLUMN_DESCRIPTIONS[col] ?? col,
    })),
    filterOperators: [...FILTER_OPERATORS],
    timeRanges: MCP_TIME_RANGES.filter((t) => t !== 'custom').map((t) => t),
    customDateRange: {
      description: 'Set timeRange to "custom" and provide startDate and endDate (YYYY-MM-DD) for arbitrary date ranges.',
      example: { timeRange: 'custom', startDate: '2026-01-01', endDate: '2026-01-31' },
    },
    granularities: [...MCP_GRANULARITIES],
  };
}
