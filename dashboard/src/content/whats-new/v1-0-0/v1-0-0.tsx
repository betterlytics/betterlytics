import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.0',
  releasedAt: '2025-08-01',
  title: 'Betterlytics 1.0 Launch + Two-Factor Authentication',
  summary:
    'The first stable release of Betterlytics introduces a reliable analytics experience along with optional two-factor authentication (TOTP) for enhanced account security.',
};

export default function ReleaseV100Content() {
  return (
    <>
      <section>
        <h2>Betterlytics 1.0</h2>
        <p>
          Version 1.0 marks the first stable release of Betterlytics, bundling the core dashboard experience into a
          production-ready product for teams that care about privacy-friendly analytics.
        </p>
      </section>

      <section>
        <h2>Two-Factor Authentication (TOTP)</h2>
        <p>
          Users can now enable time-based one-time passwords (TOTP) for their accounts, adding an extra layer of
          security on top of passwords. Any standard authenticator app can be used.
        </p>
      </section>
    </>
  );
}
