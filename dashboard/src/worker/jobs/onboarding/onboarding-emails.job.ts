import 'server-only';

import type { Job } from '@/worker/jobs/types';
import { onboardingEmailsJobDefinition } from '@/worker/jobs/definitions';
import { findOnboardingDashboardCandidates } from '@/repositories/postgres/dashboard.repository';
import type { OnboardingDashboardCandidate } from '@/entities/dashboard/dashboard.entities';
import type { UserWithoutDashboardCandidate } from '@/entities/auth/user.entities';
import { findUsersWithoutDashboardsInWindow } from '@/repositories/postgres/user.repository';
import { findEmailsWithActivePendingInvitations } from '@/repositories/postgres/invitation.repository';
import { findSentRecipientKeys } from '@/repositories/postgres/sentEmail.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createDashboardRecipientKey } from '@/services/email/recipient-key.service';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { getWorkerClickHouseClient } from '@/worker/workerClickhouse';

const HOUR_MS = 60 * 60 * 1000;

const CREATE_SITE_NUDGE_MIN_USER_AGE_HOURS = 48;
const CREATE_SITE_NUDGE_MAX_USER_AGE_HOURS = 72;

const SETUP_HELP_MIN_DASHBOARD_AGE_HOURS = 48;
const SETUP_HELP_MAX_DASHBOARD_AGE_HOURS = 72;

const FIRST_VISITOR_MAX_DASHBOARD_AGE_HOURS = 72;

const DASHBOARD_CANDIDATE_WINDOW_HOURS = Math.max(
  SETUP_HELP_MAX_DASHBOARD_AGE_HOURS,
  FIRST_VISITOR_MAX_DASHBOARD_AGE_HOURS,
);

const MAX_CANDIDATES_PER_TICK = 2000;

const CAMPAIGN_CREATE_SITE_NUDGE = 'create-site-nudge';
const CAMPAIGN_SETUP_HELP = 'setup-help';
const CAMPAIGN_FIRST_VISITOR = 'first-visitor-detected';

async function fetchSitesWithEvents(siteIds: string[], notBefore: Date): Promise<Set<string>> {
  if (siteIds.length === 0) return new Set();
  const client = getWorkerClickHouseClient();
  const cursor = client.query(
    `SELECT site_id AS siteId
      FROM analytics.events
      WHERE site_id IN {siteIds:Array(String)}
        AND timestamp >= toDateTime({notBefore:UInt32})
      GROUP BY site_id`,
    { params: { siteIds, notBefore: Math.floor(notBefore.getTime() / 1000) } },
  );
  const rows = (await cursor.toPromise()) as Array<{ siteId: string }>;
  return new Set(rows.map((r) => r.siteId));
}

async function processCreateSiteNudges(now: Date): Promise<number> {
  const rawCandidates = await findUsersWithoutDashboardsInWindow(
    {
      signedUpAfter: new Date(now.getTime() - CREATE_SITE_NUDGE_MAX_USER_AGE_HOURS * HOUR_MS),
      signedUpBefore: new Date(now.getTime() - CREATE_SITE_NUDGE_MIN_USER_AGE_HOURS * HOUR_MS),
    },
    MAX_CANDIDATES_PER_TICK,
  );
  if (rawCandidates.length === 0) return 0;
  if (rawCandidates.length === MAX_CANDIDATES_PER_TICK) {
    console.warn(
      `onboarding-emails: hit MAX_CANDIDATES_PER_TICK=${MAX_CANDIDATES_PER_TICK} for create site nudge; remainder will be processed on subsequent runs`,
    );
  }

  // Exclude users waiting on an unaccepted team invitation. They're expected to join the existing
  // dashboard, not be nudged to create their own.
  const invitedEmails = await findEmailsWithActivePendingInvitations(rawCandidates.map((c) => c.email));
  const candidates = rawCandidates.filter((c) => !invitedEmails.has(c.email.toLowerCase()));
  if (candidates.length === 0) return 0;

  const alreadySent = await findSentRecipientKeys(
    candidates.map((c) => c.userId),
    CAMPAIGN_CREATE_SITE_NUDGE,
  );
  let enqueued = 0;

  for (const candidate of candidates) {
    if (alreadySent.has(candidate.userId)) continue;
    try {
      await enqueueCreateSiteNudge(candidate);
      enqueued++;
    } catch (err) {
      console.error({ job: 'onboarding-emails', step: 'create-site-nudge', userId: candidate.userId, err });
    }
  }
  return enqueued;
}

async function processDashboardLifecycleEmails(now: Date): Promise<{ firstVisitor: number; setupHelp: number }> {
  const windowStart = new Date(now.getTime() - DASHBOARD_CANDIDATE_WINDOW_HOURS * HOUR_MS);
  const candidates = await findOnboardingDashboardCandidates(windowStart, MAX_CANDIDATES_PER_TICK);
  if (candidates.length === 0) return { firstVisitor: 0, setupHelp: 0 };
  if (candidates.length === MAX_CANDIDATES_PER_TICK) {
    console.warn(
      `onboarding-emails: hit MAX_CANDIDATES_PER_TICK=${MAX_CANDIDATES_PER_TICK} for dashboard lifecycle; remainder will be processed on subsequent runs`,
    );
  }

  const recipientKeys = candidates.map((c) => createDashboardRecipientKey(c.dashboardId));
  const [alreadySentSetupHelp, alreadySentFirstVisitor, sitesWithEvents] = await Promise.all([
    findSentRecipientKeys(recipientKeys, CAMPAIGN_SETUP_HELP),
    findSentRecipientKeys(recipientKeys, CAMPAIGN_FIRST_VISITOR),
    fetchSitesWithEvents(
      candidates.map((c) => c.siteId),
      windowStart,
    ),
  ]);

  const firstVisitorMaxAgeCutoff = new Date(now.getTime() - FIRST_VISITOR_MAX_DASHBOARD_AGE_HOURS * HOUR_MS);
  const setupHelpMinAgeCutoff = new Date(now.getTime() - SETUP_HELP_MIN_DASHBOARD_AGE_HOURS * HOUR_MS);
  const setupHelpMaxAgeCutoff = new Date(now.getTime() - SETUP_HELP_MAX_DASHBOARD_AGE_HOURS * HOUR_MS);
  let firstVisitor = 0;
  let setupHelp = 0;

  for (const candidate of candidates) {
    try {
      const createdAtMs = candidate.createdAt.getTime();
      const recipientKey = createDashboardRecipientKey(candidate.dashboardId);

      if (sitesWithEvents.has(candidate.siteId)) {
        const inWindow = createdAtMs >= firstVisitorMaxAgeCutoff.getTime();
        if (inWindow && !alreadySentFirstVisitor.has(recipientKey)) {
          await enqueueFirstVisitorDetected(candidate);
          firstVisitor++;
        }
        continue;
      }

      const inSetupHelpWindow =
        createdAtMs <= setupHelpMinAgeCutoff.getTime() && createdAtMs >= setupHelpMaxAgeCutoff.getTime();
      if (inSetupHelpWindow && !alreadySentSetupHelp.has(recipientKey)) {
        await enqueueSetupHelp(candidate);
        setupHelp++;
      }
    } catch (err) {
      console.error({ job: 'onboarding-emails', step: 'dashboard', dashboardId: candidate.dashboardId, err });
    }
  }

  return { firstVisitor, setupHelp };
}

async function enqueueCreateSiteNudge(candidate: UserWithoutDashboardCandidate): Promise<void> {
  await enqueueEmail({
    type: 'create-site-nudge',
    recipientKey: candidate.userId,
    campaignKey: CAMPAIGN_CREATE_SITE_NUDGE,
    data: {
      to: candidate.email,
      userName: candidate.name,
      dashboardsUrl: `${sharedEmailEnv.publicBaseUrl}/dashboards`,
    },
  });
}

async function enqueueFirstVisitorDetected(candidate: OnboardingDashboardCandidate): Promise<void> {
  await enqueueEmail({
    type: 'first-visitor-detected',
    recipientKey: createDashboardRecipientKey(candidate.dashboardId),
    campaignKey: CAMPAIGN_FIRST_VISITOR,
    data: {
      to: candidate.ownerEmail,
      userName: candidate.ownerName,
      domain: candidate.domain,
      dashboardUrl: `${sharedEmailEnv.publicBaseUrl}/dashboard/${candidate.dashboardId}`,
    },
  });
}

async function enqueueSetupHelp(candidate: OnboardingDashboardCandidate): Promise<void> {
  await enqueueEmail({
    type: 'setup-help',
    recipientKey: createDashboardRecipientKey(candidate.dashboardId),
    campaignKey: CAMPAIGN_SETUP_HELP,
    data: {
      to: candidate.ownerEmail,
      userName: candidate.ownerName,
      domain: candidate.domain,
      installGuideUrl: `${sharedEmailEnv.publicBaseUrl}/dashboard/${candidate.dashboardId}?showIntegration=true`,
    },
  });
}

async function runOnboardingEmails(): Promise<void> {
  const now = new Date();
  const [createSiteNudges, dashboardResults] = await Promise.all([
    processCreateSiteNudges(now),
    processDashboardLifecycleEmails(now),
  ]);

  console.info({
    job: 'onboarding-emails',
    createSiteNudges,
    firstVisitorDetected: dashboardResults.firstVisitor,
    setupHelp: dashboardResults.setupHelp,
  });
}

export const onboardingEmailsJob: Job = {
  ...onboardingEmailsJobDefinition,
  runOnStart: false,
  handler: runOnboardingEmails,
};
