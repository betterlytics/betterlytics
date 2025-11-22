import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.1',
  releasedAt: '2025-08-24',
  title: 'Monitoraggio Link Esterni, Intervalli Temporali Rapidi & Localizzazione Italiana',
  summary:
    'Ora puoi monitorare i clic sui link esterni, usare nuove scorciatoie per intervalli temporali rapidi e accedere a Betterlytics in italiano.',
};

export default function ReleaseV111ContentIT() {
  return (
    <>
      <section>
        <h2>Monitoraggio Link Esterni</h2>
        <p>
          Il monitoraggio dei link esterni è ora disponibile e mostra quali destinazioni esterne ricevono più
          interazioni. Questo ti aiuta a valutare le performance delle CTA verso partner, documentazione o altri
          siti esterni.
        </p>
      </section>

      <section>
        <h2>Scorciatoie per Intervalli Temporali Rapidi</h2>
        <p>
          Il selettore degli intervalli temporali include ora più opzioni rapide e intervalli dettagliati, rendendo
          più facile passare a finestre di report comuni o analizzare i trend senza selezione manuale delle date.
        </p>
      </section>

      <section>
        <h2>Localizzazione Italiana</h2>
        <p>
          Il dashboard è ora disponibile in italiano, offrendo un’esperienza più naturale per i team di lingua
          italiana in navigazione, report e impostazioni.
        </p>
      </section>
    </>
  );
}
