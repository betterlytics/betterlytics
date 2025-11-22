import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Ricerca più Intelligente, Filtri più Chiari & Miglioramenti di Stabilità',
  summary:
    'Questo aggiornamento introduce ricerca e filtraggio migliorati, visualizzazioni più informative, session replay più affidabile e diversi miglioramenti di stabilità e UX.',
};

export default function ReleaseV123ContentIT() {
  return (
    <>
      <section>
        <h2>Ricerca & Filtri Migliorati</h2>
        <p>
          La ricerca e i filtri ora scalano meglio con grandi dataset, rendendo più semplice trovare le
          informazioni necessarie.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Opzioni di ricerca avanzate per scoprire rapidamente eventi, pagine e proprietà importanti</li>
          <li>Dashboard panoramiche più reattive con limiti adeguati per workspace di grandi dimensioni</li>
          <li>
            Le impostazioni dei filtri sono ora riflesse nell’URL, rendendo facile salvare e condividere le viste
            filtrate
          </li>
          <li>Correzioni nella selezione dei filtri e nelle tabelle gerarchiche per divisioni più affidabili</li>
        </ul>
      </section>

      <section>
        <h2>Maggiore Contesto nelle Visualizzazioni</h2>
        <p>
          Diversi componenti visivi mostrano ora dettagli aggiuntivi per interpretare i trend più rapidamente e con
          meno clic.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Dettagli dispositivi espandibili con browser e piattaforme specifici</li>
          <li>Heatmap settimanali con tooltip che mostrano conteggi e orari precisi</li>
          <li>Riepiloghi “Nessuna modifica” per evidenziare chiaramente i periodi di confronto stabili</li>
        </ul>
      </section>

      <section>
        <h2>Miglioramenti del Session Replay</h2>
        <p>
          I session replay sono ora più affidabili e accurati, permettendo di rivedere con sicurezza le interazioni
          degli utenti senza perdere eventi chiave.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Registrazioni più affidabili e precise delle interazioni degli utenti</li>
          <li>Riproduzione delle sessioni migliorata per catturare correttamente le azioni importanti</li>
        </ul>
      </section>

      <section>
        <h2>Allineamento dei Dashboard alla Timezone</h2>
        <p>I dashboard ora mostrano l’orario locale di ciascun utente per una reportistica più intuitiva</p>
      </section>
    </>
  );
}
