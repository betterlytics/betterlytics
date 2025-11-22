import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Workspace Demo Live & Landing Page Aggiornata',
  summary:
    'Questo aggiornamento introduce un nuovo workspace demo interattivo, una landing page ridisegnata e un monitoraggio delle performance migliorato per mantenere i dashboard veloci e affidabili.',
};

export default function ReleaseV124ContentIT() {
  return (
    <>
      <section>
        <h2>Workspace Demo Live</h2>
        <p>Ora puoi esplorare Betterlytics tramite un workspace demo completamente interattivo.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Esplora dashboard, funnel e tabelle con dati di esempio precompilati</li>
          <li>Testa filtri, suddivisioni e confronti senza toccare i dati di produzione</li>
          <li>Condividi la demo con i colleghi per mostrare le capacità della piattaforma</li>
        </ul>
      </section>

      <section>
        <h2>Landing Page Ridisegnata</h2>
        <p>
          Il sito pubblico è stato aggiornato con messaggi più chiari, nuovi elementi visivi e una navigazione
          migliorata, per aiutare i visitatori a capire meglio cosa offre Betterlytics.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Testi aggiornati che evidenziano funzionalità chiave come analytics, funnel e session replay</li>
          <li>Nuovi screenshot che riflettono il prodotto attuale anche in visualizzazione mobile</li>
        </ul>
      </section>

      <section>
        <h2>Monitoraggio delle Performance Migliorato</h2>
        <p>
          Abbiamo rafforzato la telemetria interna della piattaforma per rilevare rallentamenti prima e mantenere i
          dashboard reattivi.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Individuazione più rapida dei problemi che influiscono su tempi di query o caricamento</li>
          <li>Migliori informazioni sul comportamento degli ambienti per un’esperienza più stabile</li>
          <li>Una base più solida per ulteriori miglioramenti delle performance</li>
        </ul>
      </section>
    </>
  );
}
