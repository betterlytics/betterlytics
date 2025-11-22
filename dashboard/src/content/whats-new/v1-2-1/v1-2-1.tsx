import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.1',
  releasedAt: '2025-09-22',
  title: 'Smarter Time Ranges & More Accurate Overview Metrics',
  summary:
    'This release adds richer time and comparison ranges, fixes inconsistencies in overview metrics, and improves accessibility and mobile usability.',
};

export default function ReleaseV121Content() {
  return (
    <>
      <section>
        <h2>Smarter Time & Comparison Ranges</h2>
        <p>
          Time range controls now offer more preset options and clearer comparison choices, helping you answer
          common reporting questions faster.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Quickly switch to ranges like last 24 hours, last 7 days, last 14 days, or last quarter.</li>
          <li>
            Compare performance to the previous period or last year, with the option to align weekdays for cleaner
            comparisons.
          </li>
          <li>Time and comparison selectors are now separate for better clarity and control.</li>
        </ul>
      </section>

      <section>
        <h2>More Accurate Overview Metrics</h2>
        <p>Several accuracy improvements ensure more reliable reporting across the overview page.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Summary card values now stay fully synced with underlying charts and tables.</li>
          <li>Pageview counting has been refined so inactive background tabs no longer inflate totals.</li>
        </ul>
      </section>

      <section>
        <h2>Improved Accessibility & Mobile Usability</h2>
        <p>
          We have continued to refine the overall usability of Betterlytics, especially for people signing in and
          for teams working on smaller screens.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Login forms now work more smoothly with keyboard navigation and assistive technologies.</li>
          <li>
            Mobile layouts have been enhanced for easier interaction with dashboards and controls on smaller
            screens.
          </li>
        </ul>
      </section>
    </>
  );
}
