import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.6',
  releasedAt: '2025-01-10',
  title: 'Fresh coat of paint',
  summary: 'Template entry used to validate the Whats New modal pipeline.',
};

export default function LatestWhatsNewContent() {
  return (
    <>
      <section>
        <h2>New Features</h2>
        <ul>
          <li>Quick Filters: Sync funnels, cohorts, and traffic sources instantly with a single toggle.</li>
          <li>Attribution Explorer: Group results by device, channel, or geography without reloading the page.</li>
          <li>Guided Tours: Inline walkthroughs highlight the most impactful charts for new teammates.</li>
        </ul>
      </section>

      <section>
        <h2>Enhancements</h2>
        <ul>
          <li>Exports respect your dashboard timezone and billing currency preferences.</li>
          <li>Access control badges show who can view, edit, or share each workspace.</li>
          <li>Keyboard shortcuts now cover funnel step duplication and date-range jumps.</li>
        </ul>
      </section>

      <section>
        <h2>Bug Fixes</h2>
        <ul>
          <li>Resolved rare widget flicker when switching themes.</li>
          <li>Fixed CSV exports truncating long funnel step names.</li>
          <li>Eliminated double-tracking for journeys that include embedded dashboards.</li>
        </ul>
      </section>
    </>
  );
}
