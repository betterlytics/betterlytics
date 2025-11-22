import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.5',
  releasedAt: '2025-11-23',
  title: 'Sharper funnels, cleaner data',
  summary: 'A fully redesigned funnels experience, improved data integrity, and a series of reliability fixes.',
};

export default function LatestWhatsNewContent() {
  return (
    <>
      <section>
        <h2>New Features</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Compare data over selected periods directly in the world map visualization.</li>
          <li>
            Block events from specific IP addresses to avoid skewed or unwanted traffic (e.g., your own visits).
          </li>
          <li>Automatically reject events from domains that don't match your dashboard domain.</li>
        </ul>
      </section>

      <section>
        <h2>Enhancements</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Funnels have been fully redesigned for a smoother experience.</li>
          <li>Core Web Vitals labels refined for clearer understanding.</li>
          <li>Antarctica is hidden from the world map unless it has visitor data.</li>
          <li>Added an in-app "Report a bug" button for quick feedback submissions.</li>
        </ul>
      </section>

      <section>
        <h2>Bug Fixes</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Fixed an issue causing the Core Web Vitals page to fail loading.</li>
          <li>Resolved daylight saving time issues affecting displayed analytics.</li>
        </ul>
      </section>
    </>
  );
}
