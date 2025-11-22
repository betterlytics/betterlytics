import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.5',
  releasedAt: '2025-11-23',
  title: 'Funnel più nitidi, dati più puliti',
  summary:
    'Un&apos;esperienza funnel completamente ridisegnata, una migliore integrità dei dati e una serie di miglioramenti di affidabilità.',
};

export default function LatestWhatsNewContentIt() {
  return (
    <>
      <section>
        <h2>Nuove funzionalità</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Confronta i periodi direttamente nella visualizzazione della mappa del mondo.</li>
          <li>
            Blocca gli eventi da indirizzi IP specifici per evitare traffico distorto o indesiderato (ad es. le tue
            visite).
          </li>
          <li>
            Rifiuta automaticamente gli eventi da domini che non corrispondono al dominio della tua dashboard.
          </li>
        </ul>
      </section>

      <section>
        <h2>Miglioramenti</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>I funnel sono stati completamente ridisegnati per un&apos;esperienza più fluida.</li>
          <li>Le etichette Core Web Vitals sono state affinate per una comprensione più chiara.</li>
          <li>
            L&apos;Antartide viene nascosta dalla mappa del mondo a meno che non ci siano dati di visitatori
            corrispondenti.
          </li>
          <li>
            Aggiunto un pulsante &ldquo;Segnala un bug&rdquo; direttamente nell&apos;app per inviare feedback
            rapidi.
          </li>
        </ul>
      </section>

      <section>
        <h2>Correzioni di bug</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Risolto un problema che causava l&apos;errore di caricamento della pagina Core Web Vitals.</li>
          <li>Risolti problemi legati all&apos;ora legale che influenzavano le analisi mostrate.</li>
        </ul>
      </section>
    </>
  );
}
