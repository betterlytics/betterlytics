import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.2',
  releasedAt: '2025-08-13',
  title: 'Miglioramenti Mappa Mondiale & Tracciamento Eventi Più Preciso',
  summary:
    'Questo aggiornamento migliora la chiarezza della visualizzazione della mappa mondiale e introduce una normalizzazione intelligente degli URL per report sugli eventi più accurati.',
};

export default function ReleaseV102ContentIT() {
  return (
    <>
      <section>
        <h2>Miglioramenti della Mappa Mondiale</h2>
        <p>
          La mappa mondiale è stata aggiornata con elementi visivi più chiari e bandiere dei paesi, rendendo più
          facile visualizzare e comprendere da dove proviene il traffico. Contrasto e icone sono stati migliorati
          per una migliore leggibilità.
        </p>
      </section>

      <section>
        <h2>URL Eventi più Puliti</h2>
        <p>
          Gli URL degli eventi vengono ora normalizzati automaticamente, rimuovendo variazioni come barre finali o
          "www", in modo che il traffico simile venga raggruppato correttamente per report più coerenti.
        </p>
      </section>
    </>
  );
}
