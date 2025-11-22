import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.0',
  releasedAt: '2025-08-15',
  title: 'Localized Dashboards, Smarter Maps & Richer Comparisons',
  summary:
    'Dashboards are now available in multiple languages, the world map is more intuitive to explore, and comparison values appear in more charts and progress indicators.',
};

export default function ReleaseV110Content() {
  return (
    <>
      <section>
        <h2>Dashboard Localization</h2>
        <p>
          All major dashboard pages are now localized, allowing teams to browse navigation, labels, and metrics in
          their preferred language.
        </p>
      </section>

      <section>
        <h2>Improved World Map Interactions</h2>
        <p>
          The world map has been refined to make regions easier to hover, select, and compare. Smaller and densely
          packed areas now respond more smoothly, and regional groupings are clearer at a glance
        </p>
      </section>

      <section>
        <h2>Expanded Comparison Values</h2>
        <p>
          More charts and progress bars now include hover tooltips with comparison values, making it easier to see
          how current performance compares to your baseline without switching views.
        </p>
      </section>
    </>
  );
}
