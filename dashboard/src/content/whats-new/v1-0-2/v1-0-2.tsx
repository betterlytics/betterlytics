import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.2',
  releasedAt: '2025-08-13',
  title: 'Cleaner World Map Data & More Accurate Event Tracking',
  summary:
    'This update improves the clarity of the world map visualization and introduces smarter URL normalization for more accurate event reporting.',
};

export default function ReleaseV102Content() {
  return (
    <>
      <section>
        <h2>World Map Improvements</h2>
        <p>
          The world map has been refreshed with clearer visuals and country flags, making it easier to scan and
          understand where your traffic is coming from. Contrast and iconography have been improved for better
          readability.
        </p>
      </section>

      <section>
        <h2>Cleaner Event URLs</h2>
        <p>
          Event URLs are now automatically normalized, removing variations like trailing slashes or "www", so
          similar traffic is grouped correctly for more consistent reporting.
        </p>
      </section>
    </>
  );
}
