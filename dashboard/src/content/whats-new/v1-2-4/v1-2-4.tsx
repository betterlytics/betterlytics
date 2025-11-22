import Image from 'next/image';
import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Automation guardrails & debugging superpowers',
  summary:
    'Segmented alerting, long-request heatmaps, and a revamped ingestion pipeline that makes retroactive data fixes painless.',
};

export default function ReleaseV124Content() {
  return (
    <>
      <section>
        <h2>Automation guardrails</h2>
        <p>
          Alerts can now be scoped down to individual dashboards, traffic sources, or UTM campaigns. This keeps
          noise low while ensuring the right teammate gets pinged when something unexpected happens.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Schedule quiet hours per workspace so nightly deploys no longer trigger false positives.</li>
          <li>Send alerts to multiple destinations (email, Slack, Discord) in parallel.</li>
          <li>
            Create per-dimension thresholds, e.g. &ldquo;bounce rate jumps 15% for paid traffic in Germany&rdquo;.
          </li>
        </ul>
      </section>

      <section>
        <h2>Faster investigations</h2>
        <p>
          Funnels, world map, and traffic tables now expose a request-latency overlay. Hover any data point to
          reveal which geographic region or landing page is slowing down conversions.
        </p>
        <figure className='border-border/60 bg-muted/20 mt-6 overflow-hidden rounded-2xl border shadow-sm'>
          <Image
            src='/images/demo-dashboard-desktop-dark.webp'
            width={1440}
            height={900}
            priority={false}
            className='object-cover'
            alt='Betterlytics funnel visualization showing latency overlays'
          />
          <figcaption className='text-muted-foreground border-border/60 border-t px-6 py-3 text-center text-xs tracking-[0.35em] uppercase'>
            Debug journeys without leaving Betterlytics
          </figcaption>
        </figure>
      </section>

      <section>
        <h2>Platform polish</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Rebuilt the ingestion queue to retry malformed events without blocking the healthy ones.</li>
          <li>Improved funnel sampling to keep steps consistent across retroactive date changes.</li>
          <li>Extended the public demo dataset with fresh traffic segments so comparisons feel real.</li>
        </ul>
      </section>
    </>
  );
}
