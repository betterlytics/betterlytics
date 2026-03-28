import { METRICS, METRIC_KEYS } from '@/mcp/registry/metrics';
import { DIMENSIONS, DIMENSION_KEYS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { getFilterColumnDescription } from '@/mcp/registry/filterColumns';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { MCP_GRANULARITIES } from '@/mcp/entities/mcp.entities';

type ToolInput = { name: string; type: string; required: boolean; description: string };

type SchemaDescription = {
  metrics: { key: string; description: string }[];
  dimensions: { key: string; description: string }[];
  filterColumns: { key: string; description: string; note?: string }[];
  filterOperators: readonly string[];
  filterFormat: { description: string; example: { column: string; operator: string; values: string[] } };
  timeRanges: string[];
  customDateRange: { description: string; example: { timeRange: string; startDate: string; endDate: string } };
  granularities: readonly string[];
  orderBy: { validValues: string[]; description: string };
  order: { validValues: string[]; default: string };
  timezone: { format: string; default: string; examples: string[] };
  tools: { name: string; description: string; inputs: ToolInput[] }[];
};

export function getSchemaDescription(): SchemaDescription {
  return {
    metrics: METRICS.map((m) => ({ key: m.key, description: m.description })),
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, description: d.description })),
    filterColumns: FILTER_COLUMNS.map((col) => {
      const isDimension = (DIMENSION_KEYS as readonly string[]).includes(col);
      return {
        key: col,
        description: getFilterColumnDescription(col),
        ...(isDimension ? {} : { note: 'filter only, not available as a dimension' }),
      };
    }),
    filterOperators: FILTER_OPERATORS,
    filterFormat: {
      description:
        'Each filter is an object with column, operator, and values (always an array of strings, even for a single value).',
      example: { column: 'device_type', operator: '=', values: ['mobile'] },
    },
    timeRanges: TIME_RANGE_VALUES.filter((t) => t !== 'custom'),
    customDateRange: {
      description:
        'Set timeRange to "custom" and provide startDate and endDate (YYYY-MM-DD) for arbitrary date ranges.',
      example: { timeRange: 'custom', startDate: '2026-01-01', endDate: '2026-01-31' },
    },
    granularities: MCP_GRANULARITIES,
    orderBy: {
      validValues: ['date', ...METRIC_KEYS, ...DIMENSION_KEYS],
      description:
        'Sort results by this field. Defaults to first metric. Time-series queries (with granularity) are always sorted by date.',
    },
    order: {
      validValues: ['asc', 'desc'],
      default: 'desc',
    },
    timezone: {
      format: 'IANA time zone identifier',
      default: 'UTC',
      examples: ['Europe/Berlin', 'America/New_York', 'Asia/Tokyo'],
    },
    tools: [
      {
        name: 'query',
        description: 'Query analytics data with flexible metrics and dimensions.',
        inputs: [
          {
            name: 'metrics',
            type: 'string[]',
            required: true,
            description: 'Metrics to query (see metrics above). At least one required.',
          },
          {
            name: 'dimensions',
            type: 'string[]',
            required: false,
            description: 'Dimensions to group by (see dimensions above).',
          },
          {
            name: 'timeRange',
            type: 'string',
            required: true,
            description: 'Time range preset (see timeRanges above).',
          },
          {
            name: 'startDate',
            type: 'string',
            required: false,
            description: 'YYYY-MM-DD. Required when timeRange is "custom".',
          },
          {
            name: 'endDate',
            type: 'string',
            required: false,
            description: 'YYYY-MM-DD. Required when timeRange is "custom".',
          },
          { name: 'timezone', type: 'string', required: false, description: 'IANA time zone. Defaults to UTC.' },
          {
            name: 'filters',
            type: 'array',
            required: false,
            description: 'Filters to apply (see filterFormat above).',
          },
          {
            name: 'granularity',
            type: 'string',
            required: false,
            description: 'Time-series granularity: "hour" or "day". Omit for aggregate totals.',
          },
          {
            name: 'orderBy',
            type: 'string',
            required: false,
            description: 'Field to sort by (see orderBy above). Defaults to first metric.',
          },
          { name: 'order', type: 'string', required: false, description: '"asc" or "desc". Defaults to "desc".' },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Max rows to return (1-10000). Defaults to 100.',
          },
        ],
      },
      {
        name: 'user_journeys',
        description:
          'Analyze user navigation paths. Returns Sankey diagram data (nodes + links) showing page-to-page transitions.',
        inputs: [
          {
            name: 'timeRange',
            type: 'string',
            required: true,
            description: 'Time range preset (see timeRanges above).',
          },
          { name: 'timezone', type: 'string', required: false, description: 'IANA time zone. Defaults to UTC.' },
          {
            name: 'filters',
            type: 'array',
            required: false,
            description: 'Filters to apply (see filterColumns and filterOperators above).',
          },
          {
            name: 'maxSteps',
            type: 'number',
            required: false,
            description: 'Maximum journey depth (2-10). Defaults to 3.',
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Max number of top paths to return (1-500). Defaults to 50.',
          },
        ],
      },
      {
        name: 'funnel_preview',
        description:
          'Run ad-hoc funnel analysis. Define ordered steps (filter conditions) to see visitor dropoff.',
        inputs: [
          {
            name: 'timeRange',
            type: 'string',
            required: true,
            description: 'Time range preset (see timeRanges above).',
          },
          { name: 'timezone', type: 'string', required: false, description: 'IANA time zone. Defaults to UTC.' },
          {
            name: 'steps',
            type: 'array',
            required: true,
            description:
              'Ordered funnel steps (min 2). Each: { name, column, operator, values } using filterColumns and filterOperators above.',
          },
          {
            name: 'isStrict',
            type: 'boolean',
            required: false,
            description:
              'If true, steps must occur sequentially without other pages in between. Defaults to false.',
          },
        ],
      },
      {
        name: 'list_funnels',
        description: 'List saved funnels for this site with conversion data.',
        inputs: [
          {
            name: 'timeRange',
            type: 'string',
            required: true,
            description: 'Time range preset (see timeRanges above).',
          },
          { name: 'timezone', type: 'string', required: false, description: 'IANA time zone. Defaults to UTC.' },
        ],
      },
      {
        name: 'list_errors',
        description:
          'List client-side JavaScript errors grouped by type, sorted by occurrence count. Returns fingerprints, types, messages, counts, status, and timestamps.',
        inputs: [
          {
            name: 'timeRange',
            type: 'string',
            required: true,
            description: 'Time range preset (see timeRanges above).',
          },
          { name: 'timezone', type: 'string', required: false, description: 'IANA time zone. Defaults to UTC.' },
          {
            name: 'search',
            type: 'string',
            required: false,
            description:
              'Case-insensitive text search across error type and message. E.g. "TypeError" or "Cannot read properties".',
          },
          {
            name: 'fingerprint',
            type: 'string',
            required: false,
            description: 'Look up a specific error by its fingerprint ID. Use a fingerprint from a previous list_errors call, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
          },
          {
            name: 'filters',
            type: 'array',
            required: false,
            description: 'Filters to narrow results. Same format as the query tool: { column, operator, values }.',
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Max error groups to return (1-50). Defaults to 10.',
          },
        ],
      },
      {
        name: 'get_error',
        description:
          'Get detailed info about a specific error: stack trace, browser/OS/device context, and breadcrumbs (user actions leading up to the error). Use the fingerprint from list_errors, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
        inputs: [
          {
            name: 'fingerprint',
            type: 'string',
            required: true,
            description: 'The error fingerprint identifier. Use list_errors to find it, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
          },
          {
            name: 'occurrenceOffset',
            type: 'number',
            required: false,
            description: 'Occurrence index. 0 = latest, 1 = second latest, etc. Defaults to 0.',
          },
          {
            name: 'includeBreadcrumbs',
            type: 'boolean',
            required: false,
            description:
              'Include breadcrumbs. The trail of user actions (page views, clicks, navigations) before the error. Defaults to true.',
          },
        ],
      },
    ],
  };
}
