import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.2',
  releasedAt: '2025-10-20',
  title: 'Privacy-First Session Replay & Faster Dashboards',
  summary:
    'This release introduces anonymized session replay, performance improvements across dashboards, and updated translations for a smoother global experience.',
};

export default function ReleaseV122Content() {
  return (
    <>
      <section>
        <h2>Privacy-First Session Replay</h2>
        <p>
          Session replay is now available, letting you watch anonymized recordings of how visitors interact with
          your site. Sensitive information, such as text, form inputs, and images, is automatically masked to
          protect user privacy.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Understand where users hesitate, scroll, or drop off</li>
          <li>Identify frustration signals like rage clicks</li>
          <li>Share replays with your team without exposing personal data</li>
        </ul>
      </section>

      <section>
        <h2>Faster, Smoother Dashboards</h2>
        <p>
          We have reduced unnecessary re-renders across core views so dashboards feel snappier, especially on
          larger workspaces. Navigating between reports and applying filters should now feel more responsive.
        </p>
      </section>

      <section>
        <h2>Translation Improvements</h2>
        <p>
          Missing translations and inconsistent phrasing have been updated, providing a more polished experience
          for international teams.
        </p>
      </section>
    </>
  );
}
