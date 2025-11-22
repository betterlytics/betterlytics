import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Mese della affidabilità',
  summary:
    'Archiviazione delle session replay stabilizzata, monitoraggio delle quote semplificato e motore di attribuzione ottimizzato.',
};

export default function ReleaseV123ContentIt() {
  return (
    <>
      <section>
        <h2>Retention delle replay</h2>
        <p>
          I file di session replay ora vivono in uno storage oggetti ridondante con regole di lifecycle
          automatiche. Il player espone anche una scorciatoia &ldquo;salta al rage click&rdquo; che trova il
          momento esatto in cui un visitatore ha avuto problemi.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Ogni replay mostra chiaramente quanti giorni mancano prima della scadenza.</li>
          <li>Scarica le registrazioni senza uscire dalla vista timeline.</li>
          <li>I membri del team possono lasciare note private direttamente sulla replay.</li>
        </ul>
      </section>

      <section>
        <h2>Quote più chiare</h2>
        <p>
          La fatturazione ora mette in evidenza l&apos;utilizzo di eventi per sito e suggerimenti per restare sotto
          le soglie morbide. Gli avvisi ti avvisano quando raggiungi l&apos;80% del piano, così hai tempo per
          aggiornare o ripulire gli eventi rumorosi.
        </p>
      </section>

      <section>
        <h2>Attribuzione ottimizzata</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>I referrer con query string lunghe vengono ora normalizzati automaticamente.</li>
          <li>
            I parametri UTM rispettano l&apos;attribuzione last non-direct quando confronti diversi intervalli
            temporali.
          </li>
          <li>
            Le pagine di drill-down delle campagne si caricano due volte più velocemente grazie a nuove
            materialized view in ClickHouse.
          </li>
        </ul>
      </section>
    </>
  );
}
