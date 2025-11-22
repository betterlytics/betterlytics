import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.1',
  releasedAt: '2025-08-24',
  title: 'Outbound Link Tracking, Faster Time Ranges & Italian Localization',
  summary:
    'You can now track outbound link clicks, use new quick time-range options for faster analysis, and access Betterlytics in Italian.',
};

export default function ReleaseV111Content() {
  return (
    <>
      <section>
        <h2>Outbound Link Tracking</h2>
        <p>
          Outbound link tracking is now available, showing which external destinations receive the most engagement.
          This helps you measure the performance of CTAs that lead to partners, documentation, or other external
          sites.
        </p>
      </section>

      <section>
        <h2>Faster Time Range Shortcuts</h2>
        <p>
          The time range selector now includes more quick options and granular intervals, making it easier to jump
          to common reporting windows or zoom in on trends without manual date selection.
        </p>
      </section>

      <section>
        <h2>Italian Localization</h2>
        <p>
          The dashboard is now available in Italian, offering a more natural experience for Italian-speaking teams
          across navigation, reports, and settings.
        </p>
      </section>
    </>
  );
}
