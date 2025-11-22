import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Smarter Search, Clearer Filters & Stability Improvements',
  summary:
    'This update introduces improved search and filtering, more informative visualizations, better session replay controls, and several stability and UX enhancements.',
};

export default function ReleaseV123Content() {
  return (
    <>
      <section>
        <h2>Improved Search & Filters</h2>
        <p>
          Search and filtering now scale better with large datasets, making it easier to find the information you
          need.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Richer search options for quickly discovering key events, pages, and properties</li>
          <li>More responsive overview tables with sensible limits for large workspaces</li>
          <li>Filter settings are now reflected in the URL, making filtered views easy to bookmark and share</li>
          <li>Fixes to filter selection and hierarchical tables for more reliable breakdowns</li>
        </ul>
      </section>

      <section>
        <h2>More Context in Visualizations</h2>
        <p>
          Several visual components now surface extra detail to help you interpret trends faster and with fewer
          clicks.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Expandable device details showing specific browsers and platforms</li>
          <li>Weekly heatmaps with hover tooltips for exact counts and timestamps</li>
          <li>&ldquo;No change&rdquo; summaries to clearly highlight stable comparison periods</li>
        </ul>
      </section>

      <section>
        <h2>Session Replay Improvements</h2>
        <p>
          Session replays are now more reliable and accurate, so you can confidently review user interactions
          without missing key events or encountering inconsistencies.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>More reliable and accurate recordings of user interactions</li>
          <li>Improved playback of sessions so key actions are captured correctly</li>
        </ul>
      </section>

      <section>
        <h2>Dashboard Timezone Alignment</h2>
        <p>Dashboards now reflect each user’s local time for more intuitive reporting</p>
      </section>
    </>
  );
}
