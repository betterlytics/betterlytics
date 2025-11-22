import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.1',
  releasedAt: '2025-09-22',
  title: 'Intervalli Temporali Più Intelligenti & Metriche Panoramiche più Accurate',
  summary:
    'Questa versione aggiunge intervalli temporali e di confronto più ricchi, corregge incongruenze nelle metriche panoramiche e migliora l’accessibilità e l’usabilità su mobile.',
};

export default function ReleaseV121ContentIT() {
  return (
    <>
      <section>
        <h2>Intervalli Temporali & Confronto Più Intelligenti</h2>
        <p>
          I controlli degli intervalli temporali offrono ora più opzioni preimpostate e scelte di confronto più
          chiare, aiutandoti a rispondere più velocemente alle domande comuni di report.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>
            Passa rapidamente a intervalli come ultime 24 ore, ultimi 7 giorni, ultimi 14 giorni o ultimo
            trimestre.
          </li>
          <li>
            Confronta le performance con il periodo precedente o con l’anno scorso, con opzione di allineare i
            giorni della settimana per confronti più precisi.
          </li>
          <li>I selettori di intervallo e confronto sono ora separati per maggiore chiarezza e controllo.</li>
        </ul>
      </section>

      <section>
        <h2>Metriche Panoramiche più Accurate</h2>
        <p>Alcuni miglioramenti garantiscono report più affidabili nella pagina panoramica.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>
            I valori delle schede di riepilogo sono ora completamente sincronizzati con grafici e tabelle
            sottostanti.
          </li>
          <li>
            Il conteggio delle visualizzazioni di pagina è stato migliorato, così le schede in background inattive
            non aumentano più i totali.
          </li>
        </ul>
      </section>

      <section>
        <h2>Migliorata Accessibilità & Usabilità Mobile</h2>
        <p>
          Abbiamo continuato a migliorare l’usabilità generale di Betterlytics, soprattutto per il login e per i
          team che lavorano su schermi più piccoli.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>I form di login funzionano meglio con la navigazione da tastiera e le tecnologie assistive.</li>
          <li>
            I layout mobile sono stati migliorati per facilitare l’interazione con dashboard e controlli su schermi
            piccoli.
          </li>
        </ul>
      </section>
    </>
  );
}
