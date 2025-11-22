import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v0.1.0',
  releasedAt: '2025-04-25',
  title: 'Fondamenti Iniziali di Betterlytics',
  summary:
    'Abbiamo iniziato a costruire Betterlytics con focus su analytics rispettosi della privacy, un dashboard intuitivo e una pipeline di eventi veloce e affidabile.',
};

export default function ReleaseV010ContentIT() {
  return (
    <>
      <section>
        <h2>Avvio del Progetto</h2>
        <p>
          Lo sviluppo è iniziato con un piccolo prototipo interno che combinava una pipeline di eventi, un
          dashboard iniziale e primi esperimenti di visualizzazione. Fin dal primo giorno, l’obiettivo era rendere
          le analytics di prodotto e marketing affidabili, azionabili e conformi al GDPR.
        </p>
      </section>

      <section>
        <h2>Architettura Orientata alle Prestazioni</h2>
        <p>
          Diversamente da molte piattaforme open-source di analytics scritte in JavaScript o linguaggi simili,
          abbiamo dato priorità a velocità e scalabilità. Decisioni iniziali includevano l’uso di Rust per calcoli
          efficienti e ClickHouse per storage ad alte prestazioni, garantendo che la piattaforma potesse gestire
          grandi dataset senza rallentamenti.
        </p>
      </section>

      <section>
        <h2>Fondamenti, Non Funzionalità</h2>
        <p>
          Durante questo periodo pre-1.0, l’attenzione era sulla costruzione dell’architettura di base piuttosto
          che sulle funzionalità pubbliche: progettazione dello storage, modellazione dei dati e ottimizzazione
          delle query prima di aprire l’accesso a un pubblico più ampio.
        </p>
      </section>
    </>
  );
}
