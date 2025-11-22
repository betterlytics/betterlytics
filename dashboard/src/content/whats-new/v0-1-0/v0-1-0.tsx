import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v0.1.0',
  releasedAt: '2025-04-25',
  title: 'Early Foundations of Betterlytics',
  summary:
    'We started building Betterlytics with a focus on privacy-friendly analytics, an intuitive dashboard, and a fast, reliable event pipeline.',
};

export default function ReleaseV010Content() {
  return (
    <>
      <section>
        <h2>Project Kickoff</h2>
        <p>
          Development began with a small internal prototype combining an event pipeline, initial dashboard, and
          early charting experiments. From day one, the goal was to make product and marketing analytics
          trustworthy, actionable, and privacy-compliant (GDPR-ready).
        </p>
      </section>

      <section>
        <h2>Performance-Focused Architecture</h2>
        <p>
          Unlike many open-source analytics platforms built in JavaScript or other similar languages, we
          prioritized speed and scalability. Early decisions included using Rust for efficient computation and
          ClickHouse for high-performance data storage, ensuring the platform could handle large datasets without
          slowing down.
        </p>
      </section>

      <section>
        <h2>Foundations, Not Features</h2>
        <p>
          During this pre-1.0 period, the focus was on building the underlying architecture rather than
          public-facing features: designing storage, shaping the data model, and refining query performance before
          opening up broader access.
        </p>
      </section>
    </>
  );
}
