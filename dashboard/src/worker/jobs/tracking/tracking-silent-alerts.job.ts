import 'server-only';

import type { Job } from '@/worker/jobs/types';
import { trackingSilentAlertsJobDefinition } from '@/worker/jobs/definitions';
import { findTrackingSilentRecipients } from '@/repositories/postgres/dashboard.repository';
import { findSentCampaignKeysByPrefix } from '@/repositories/postgres/sentEmail.repository';
import { BILLABLE_EVENT_TYPES } from '@/entities/billing/billing.entities';
import { enqueueEmail } from '@/services/email/email.service';
import { createDashboardRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';
import {
  classifyTrackingSilence,
  earliestNeededDay,
  findSilenceCandidates,
  isNewEpisode,
  lookbackStart,
  OUTAGE_SILENT_SHARE,
  parseTrackingSilentCampaignKey,
  TRACKING_SILENT_CAMPAIGN_PREFIX,
  trackingSilentCampaignKey,
  type DailyEventTotals,
} from '@/worker/jobs/tracking/tracking-silence';

const JOB = 'tracking-silent-alerts';

async function fetchDailyEventTotals(sinceDay: string): Promise<Map<string, DailyEventTotals>> {
  const client = getWorkerClickHouseClient();
  const cursor = client.query(
    `SELECT site_id AS siteId, toString(date) AS day, sum(event_count) AS total
      FROM analytics.usage_daily
      WHERE date >= toDate({sinceDay:String})
      GROUP BY site_id, date`,
    { params: { sinceDay } },
  );
  const rows = (await cursor.toPromise()) as Array<{ siteId: string; day: string; total: number | string }>;

  const dailyBySite = new Map<string, DailyEventTotals>();
  for (const row of rows) {
    let daily = dailyBySite.get(row.siteId);
    if (!daily) {
      daily = new Map();
      dailyBySite.set(row.siteId, daily);
    }
    daily.set(row.day, Number(row.total));
  }
  return dailyBySite;
}

async function fetchLastEventTimes(siteIds: string[], notBefore: Date): Promise<Map<string, Date>> {
  if (siteIds.length === 0) return new Map();
  const client = getWorkerClickHouseClient();
  const cursor = client.query(
    `SELECT site_id AS siteId, toUnixTimestamp(max(timestamp)) AS lastEventAt
      FROM analytics.events
      WHERE site_id IN {siteIds:Array(String)}
        AND event_type IN {eventTypes:Array(String)}
        AND timestamp >= toDateTime({notBefore:UInt32})
      GROUP BY site_id`,
    {
      params: {
        siteIds,
        eventTypes: [...BILLABLE_EVENT_TYPES],
        notBefore: Math.floor(notBefore.getTime() / 1000),
      },
    },
  );
  const rows = (await cursor.toPromise()) as Array<{ siteId: string; lastEventAt: number | string }>;
  return new Map(rows.map((r) => [r.siteId, new Date(Number(r.lastEventAt) * 1000)]));
}

async function runTrackingSilentAlerts(): Promise<void> {
  const now = new Date();
  const dailyBySite = await fetchDailyEventTotals(earliestNeededDay(now));
  const candidates = findSilenceCandidates(dailyBySite, now);
  const lastEventAtByCandidate = await fetchLastEventTimes(candidates, lookbackStart(now));
  const { baselineSiteCount, silent, isOutage } = classifyTrackingSilence(
    dailyBySite,
    lastEventAtByCandidate,
    now,
  );

  if (isOutage) {
    console.error({
      job: JOB,
      msg: `more than ${OUTAGE_SILENT_SHARE * 100}% of baseline sites are silent; suspected Betterlytics-side outage, sending nothing`,
      baselineSiteCount,
      silentSiteCount: silent.length,
    });
    return;
  }

  const lastEventAtBySite = new Map(silent.map((s) => [s.siteId, s.lastEventAt]));
  const recipients = await findTrackingSilentRecipients(silent.map((s) => s.siteId));
  const sentCampaignKeys = await findSentCampaignKeysByPrefix(
    recipients.map((r) => createDashboardRecipientKey(r.dashboardId)),
    TRACKING_SILENT_CAMPAIGN_PREFIX,
  );

  let enqueued = 0;
  for (const recipient of recipients) {
    const recipientKey = createDashboardRecipientKey(recipient.dashboardId);
    const lastEventAt = lastEventAtBySite.get(recipient.siteId)!;
    const previouslyEmailed = (sentCampaignKeys.get(recipientKey) ?? []).flatMap(
      (key) => parseTrackingSilentCampaignKey(key) ?? [],
    );
    if (!isNewEpisode(lastEventAt, previouslyEmailed)) continue;
    try {
      const result = await enqueueEmail({
        type: 'tracking-silent',
        recipientKey,
        campaignKey: trackingSilentCampaignKey(lastEventAt),
        data: {
          to: recipient.ownerEmail,
          userName: recipient.ownerName,
          domain: recipient.domain,
          lastEventAt: lastEventAt.toISOString(),
          timeZone: recipient.ownerTimezone,
          installGuideUrl: `${sharedEmailEnv.publicBaseUrl}/dashboard/${recipient.dashboardId}?showIntegration=true`,
        },
      });
      if (result === 'enqueued') enqueued++;
    } catch (err) {
      console.error({ job: JOB, dashboardId: recipient.dashboardId, err });
    }
  }

  console.info({ job: JOB, baselineSiteCount, silentSiteCount: silent.length, enqueued });
}

export const trackingSilentAlertsJob: Job = {
  ...trackingSilentAlertsJobDefinition,
  runOnStart: false,
  handler: runTrackingSilentAlerts,
};
