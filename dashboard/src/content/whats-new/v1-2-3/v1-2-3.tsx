import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Reliability month',
  summary: 'Stabilized session replay storage, simplified quota monitoring, and tuned the attribution engine.',
};

export default function ReleaseV123Content() {
  return (
    <>
      <section>
        <h2>Replay retention</h2>
        <p>
          Session replay files now live in redundant object storage with automatic lifecycle rules. The player also
          exposes a &ldquo;jump to rage click&rdquo; shortcut that finds the exact moment a visitor struggled.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Every replay clearly states how many days remain before it expires.</li>
          <li>Download recordings without leaving the timeline view.</li>
          <li>Team members can leave private notes directly on the replay.</li>
        </ul>
      </section>

      <section>
        <h2>Quota clarity</h2>
        <p>
          Billing now surfaces per-site event usage plus recommendations to stay under soft limits. Alerts warn you
          when 80% of your plan is used so you have time to upgrade or clean up noisy events.
        </p>
      </section>

      <section>
        <h2>Attribution tune-up</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Referrers with long query strings are now automatically normalized.</li>
          <li>UTM parameters respect last non-direct attribution when comparing time ranges.</li>
          <li>Campaign drill-down pages load twice as fast thanks to new ClickHouse materialized views.</li>
        </ul>
      </section>
    </>
  );
}
