import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Live Demo Workspace & Refreshed Landing Page',
  summary:
    'This update introduces a new live demo workspace, a redesigned landing page, and improved internal performance monitoring to keep dashboards fast and reliable.',
};

export default function ReleaseV124Content() {
  return (
    <>
      <section>
        <h2>Live Demo Workspace</h2>
        <p>You can now explore Betterlytics using a fully interactive demo workspace.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Browse dashboards, funnels, and tables with pre-populated sample data</li>
          <li>Test filters, breakdowns, and comparisons without touching production data</li>
          <li>Share the demo with teammates to preview the platform's capabilities</li>
        </ul>
      </section>

      <section>
        <h2>Redesigned Landing Page</h2>
        <p>
          The public website has been updated with clearer messaging, new visuals, and improved navigation to help
          visitors understand what Betterlytics offers.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Updated copy highlighting core features like analytics, funnels, and session replay</li>
          <li>New screenshots that reflect the current product for mobile view</li>
        </ul>
      </section>

      <section>
        <h2>Improved Performance Monitoring</h2>
        <p>
          We've strengthened the platform's internal performance telemetry to detect slowdowns earlier and keep
          dashboards responsive.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Faster identification of issues affecting query times or loading speed</li>
          <li>Better insights into environment behaviour for a more stable experience</li>
          <li>A stronger foundation for ongoing performance improvements</li>
        </ul>
      </section>
    </>
  );
}
