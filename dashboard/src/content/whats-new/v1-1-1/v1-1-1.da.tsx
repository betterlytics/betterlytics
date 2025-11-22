import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.1',
  releasedAt: '2025-08-24',
  title: 'Sporing af Udgående Links, Hurtigere Tidsintervaller & Italiensk Lokalisation',
  summary:
    'Du kan nu spore klik på udgående links, bruge nye hurtige tidsintervaller til hurtigere analyse og få adgang til Betterlytics på italiensk.',
};

export default function ReleaseV111ContentDA() {
  return (
    <>
      <section>
        <h2>Sporing af Udgående Links</h2>
        <p>
          Udgående link-sporing er nu tilgængelig og viser, hvilke eksterne destinationer der får mest engagement.
          Dette hjælper dig med at måle, hvordan CTA’er mod partnere, dokumentation eller andre eksterne sider
          præsterer.
        </p>
      </section>

      <section>
        <h2>Hurtigere Tidsintervalgenveje</h2>
        <p>
          Tidsvælgeren indeholder nu flere hurtige muligheder og mere detaljerede intervaller, så du nemt kan hoppe
          til almindelige rapporteringsvinduer eller zoome ind på trends uden manuel datovalg.
        </p>
      </section>

      <section>
        <h2>Italiensk Lokalisation</h2>
        <p>
          Dashboardet er nu tilgængeligt på italiensk, hvilket giver en mere naturlig oplevelse for
          italiensktalende teams i navigation, rapporter og indstillinger.
        </p>
      </section>
    </>
  );
}
