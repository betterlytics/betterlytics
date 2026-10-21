import { McpQuerySessionsInputSchema, McpQueryResultSchema } from '@/mcp/entities/mcp.entities';
import { buildSessionsQuery } from '@/mcp/query-builder/sessionBuilder';
import { clickhouse } from '@/lib/clickhouse';

export async function executeQuerySessions(rawInput: unknown, siteId: string) {
  const input = McpQuerySessionsInputSchema.parse(rawInput);
  const { taggedSql, taggedParams } = buildSessionsQuery(input, siteId);

  const result = await clickhouse.query(taggedSql, { params: taggedParams }).toPromise();

  return McpQueryResultSchema.parse(result);
}
