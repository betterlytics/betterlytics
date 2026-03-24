import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { NotificationHistoryRow, NotificationHistoryRowSchema } from '@/entities/dashboard/notificationHistory.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

export async function getNotificationHistory(
  dashboardId: string,
  monitorId?: string,
): Promise<NotificationHistoryRow[]> {
  const monitorFilter = monitorId
    ? safeSql`AND monitor_id = ${SQL.String({ monitor_id: monitorId })}`
    : safeSql``;

  const query = safeSql`
    SELECT ts, integration_type, title, status, error_message, attempt_count
    FROM analytics.notification_history
    WHERE dashboard_id = ${SQL.String({ dashboard_id: dashboardId })}
    ${monitorFilter}
    ORDER BY ts DESC
    LIMIT 50
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: query.taggedParams,
    })
    .toPromise()) as any[];

  return result.map((row) =>
    NotificationHistoryRowSchema.parse({
      ts: parseClickHouseDate(row.ts),
      integrationType: row.integration_type,
      title: row.title,
      status: row.status,
      errorMessage: row.error_message,
      attemptCount: row.attempt_count,
    }),
  );
}
