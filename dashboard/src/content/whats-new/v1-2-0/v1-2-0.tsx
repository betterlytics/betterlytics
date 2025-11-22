import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.0',
  releasedAt: '2025-09-14',
  title: 'Weekly Heatmap, Full Site Redesign & Core Web Vitals',
  summary:
    'This update introduces a full redesign of the Betterlytics website, a weekly engagement heatmap, updated overview metrics, guided onboarding for new workspaces, and real-user Core Web Vitals tracking.',
};

export default function ReleaseV120Content() {
  return (
    <>
      <section>
        <h2>Full Website & Dashboard Redesign</h2>
        <p>
          The entire website and all dashboards have been updated with a refreshed visual theme, unified colors,
          consistent typography, and improved layout. Navigation, tables, charts, dialogs, and tooltips have all
          been refined for a cleaner, more intuitive experience on both desktop and mobile.
        </p>
      </section>

      <section>
        <h2>Weekly Engagement Heatmap</h2>
        <p>
          The overview page now includes a weekly heatmap showing traffic patterns by day and hour. Quickly spot
          peak periods, quiet hours, and unusual spikes in activity at a glance.
        </p>
      </section>

      <section>
        <h2>More Context in Overview Charts</h2>
        <p>
          Two new metric cards have been added to the overview chart: total session count and average visit
          duration. This makes it easier to connect high-level traffic trends with how long people actually stay on
          your site.
        </p>
      </section>

      <section>
        <h2>More Detailed Sparkline Trends</h2>
        <p>
          Summary card sparklines now support finer-grained time buckets, giving you a clearer view of how metrics
          move inside a selected range. Short-lived spikes and dips are easier to spot without opening a full
          report.
        </p>
      </section>

      <section>
        <h2>Guided Onboarding for New Users</h2>
        <p>
          New accounts now receive a step-by-step onboarding flow that covers adding the tracking script and
          exploring core dashboards, making setup faster and more approachable
        </p>
      </section>

      <section>
        <h2>Real-User Core Web Vitals</h2>
        <p>
          Betterlytics now captures Core Web Vitals directly from real visitor sessions, giving you an accurate
          view of site performance in the wild. Use these metrics to identify and address regressions before they
          affect conversions.
        </p>
      </section>
    </>
  );
}
