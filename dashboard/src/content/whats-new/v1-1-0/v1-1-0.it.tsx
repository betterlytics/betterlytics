import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.0',
  releasedAt: '2025-08-15',
  title: 'Dashboard Localizzate, Mappe Intelligenti & Confronti Più Ricchi',
  summary:
    'I dashboard sono ora disponibili in più lingue, la mappa mondiale è più intuitiva da esplorare e i valori di confronto appaiono in più grafici e indicatori di progresso.',
};

export default function ReleaseV110ContentIT() {
  return (
    <>
      <section>
        <h2>Localizzazione dei Dashboard</h2>
        <p>
          Tutte le principali pagine dei dashboard sono ora localizzate, permettendo ai team di navigare, leggere
          etichette e visualizzare metriche nella lingua preferita.
        </p>
      </section>

      <section>
        <h2>Interazioni Migliorate sulla Mappa Mondiale</h2>
        <p>
          La mappa mondiale è stata perfezionata per rendere più semplice passare il mouse, selezionare e
          confrontare le regioni. Le aree più piccole o densamente popolate reagiscono in modo più fluido e i
          raggruppamenti regionali sono più chiari a colpo d’occhio.
        </p>
      </section>

      <section>
        <h2>Valori di Confronto Espansi</h2>
        <p>
          Più grafici e barre di progresso ora includono tooltip con valori di confronto, rendendo più facile
          vedere come le performance attuali si confrontano con il riferimento senza cambiare vista.
        </p>
      </section>
    </>
  );
}
