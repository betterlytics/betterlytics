import Image from 'next/image';
import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Paracadute per le automazioni e debug più rapido',
  summary:
    'Avvisi segmentati, heatmap delle richieste lente e una pipeline di ingest migliorata che rende semplici le correzioni retroattive dei dati.',
};

export default function ReleaseV124ContentIt() {
  return (
    <>
      <section>
        <h2>Paracadute per le automazioni</h2>
        <p>
          Gli avvisi ora possono essere limitati a singole dashboard, sorgenti di traffico o campagne UTM. Questo
          mantiene basso il rumore e assicura che la persona giusta venga avvisata quando succede qualcosa di
          inaspettato.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Configura orari di quiete per workspace così i deploy notturni non generano falsi positivi.</li>
          <li>Invia avvisi a più destinazioni (e-mail, Slack, Discord) in parallelo.</li>
          <li>
            Crea soglie per dimensione, ad es. &ldquo;il bounce rate aumenta del 15% per il traffico a pagamento in
            Italia&rdquo;.
          </li>
        </ul>
      </section>

      <section>
        <h2>Indagini più veloci</h2>
        <p>
          Funnels, mappa del mondo e tabelle di traffico mostrano ora un overlay di latenza delle richieste. Passa
          il mouse su un punto dati per vedere quale regione geografica o landing page sta rallentando le
          conversioni.
        </p>
        <figure className='border-border/60 bg-muted/20 mt-6 overflow-hidden rounded-2xl border shadow-sm'>
          <Image
            src='/images/demo-dashboard-desktop-dark.webp'
            width={1440}
            height={900}
            priority={false}
            className='object-cover'
            alt='Visualizzazione funnel di Betterlytics con overlay di latenza'
          />
          <figcaption className='text-muted-foreground border-border/60 border-t px-6 py-3 text-center text-xs tracking-[0.35em] uppercase'>
            Debug dei percorsi senza uscire da Betterlytics
          </figcaption>
        </figure>
      </section>

      <section>
        <h2>Rifiniture della piattaforma</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Ricostruita la coda di ingest per ritentare gli eventi malformati senza bloccare quelli sani.</li>
          <li>
            Migliorato il campionamento dei funnel per mantenere i passaggi coerenti sui cambi retroattivi di date.
          </li>
          <li>
            Esteso il dataset demo pubblico con nuovi segmenti di traffico in modo che i confronti sembrino più
            realistici.
          </li>
        </ul>
      </section>
    </>
  );
}
