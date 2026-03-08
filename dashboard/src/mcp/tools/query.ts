import { McpQueryInputSchema, McpQueryResultSchema } from '@/mcp/entities/mcp.entities';
import { buildQuery } from '@/mcp/query-builder/builder';
import { clickhouse } from '@/lib/clickhouse';

export async function executeQuery(rawInput: unknown, siteId: string) {
  const input = McpQueryInputSchema.parse(rawInput);
  const { taggedSql, taggedParams } = buildQuery(input, siteId);

  const result = await clickhouse
    .query(taggedSql, { params: taggedParams })
    .toPromise();

  return McpQueryResultSchema.parse(result);
}
