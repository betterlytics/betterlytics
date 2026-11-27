import { McpQueryInputSchema } from '@/mcp/entities/mcp.entities';
import { QueryResultSchema } from '@/lib/analytics-query/query.entities';
import { buildQuery } from '@/lib/analytics-query/query-builder/builder';
import { clickhouse } from '@/lib/clickhouse';

export async function executeQuery(rawInput: unknown, siteId: string) {
  const input = McpQueryInputSchema.parse(rawInput);
  const { taggedSql, taggedParams } = buildQuery(input, siteId);

  const result = await clickhouse
    .query(taggedSql, { params: taggedParams })
    .toPromise();

  return QueryResultSchema.parse(result);
}
