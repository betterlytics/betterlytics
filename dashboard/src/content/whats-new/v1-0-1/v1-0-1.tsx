import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.1',
  releasedAt: '2025-08-11',
  title: 'Social Login, Funnels & Gravatar Avatars',
  summary:
    'This update introduces Google and GitHub sign-in options, new funnel analytics for tracking drop-offs, and optional Gravatar-based avatars for workspaces.',
};

export default function ReleaseV101Content() {
  return (
    <>
      <section>
        <h2>Google & GitHub Sign-In</h2>
        <p>Users can now sign in with Google or GitHub for easier onboarding and a quicker sign-up process.</p>
      </section>

      <section>
        <h2>Funnels for Drop-Off Analysis</h2>
        <p>
          Funnels are now available, letting you visualize how users move through multi-step journeys and where
          they drop off. Use this to optimize sign-up flows, onboarding, and other key conversions.
        </p>
      </section>

      <section>
        <h2>Gravatar Avatars</h2>
        <p>
          Users can now enable Gravatar-based profile images, offering simple, recognizable avatars without needing
          uploads.
        </p>
      </section>
    </>
  );
}
