import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.0',
  releasedAt: '2025-09-14',
  title: 'Heatmap Settimanale, Nuova UI & Core Web Vitals',
  summary:
    'Questo aggiornamento introduce un completo redesign del sito Betterlytics, un heatmap settimanale di engagement, metriche aggiornate nella panoramica, onboarding guidato per i nuovi workspace e monitoraggio dei Core Web Vitals con dati reali.',
};

export default function ReleaseV120ContentIT() {
  return (
    <>
      <section>
        <h2>Redesign Completo del Sito e dei Dashboard</h2>
        <p>
          L’intero sito e tutti i dashboard sono stati aggiornati con un tema visivo rinnovato, colori uniformi,
          tipografia coerente e layout migliorato. Navigazione, tabelle, grafici, dialog e tooltip sono stati
          perfezionati per un’esperienza più pulita e intuitiva su desktop e mobile.
        </p>
      </section>

      <section>
        <h2>Heatmap Settimanale di Engagement</h2>
        <p>
          La pagina panoramica ora include una heatmap settimanale che mostra i pattern di traffico per giorno e
          ora. Individua rapidamente i periodi di picco, le ore più tranquille e eventuali picchi insoliti di
          attività.
        </p>
      </section>

      <section>
        <h2>Maggiore Contesto nei Grafici Panoramici</h2>
        <p>
          Sono state aggiunte due nuove schede metriche al grafico panoramico: numero totale di sessioni e durata
          media delle visite. Questo aiuta a collegare le tendenze generali del traffico con il tempo effettivo
          trascorso dagli utenti sul sito.
        </p>
      </section>

      <section>
        <h2>Trend Sparkline più Dettagliati</h2>
        <p>
          Le sparklines nelle schede di riepilogo supportano intervalli temporali più dettagliati, offrendo una
          visione più chiara di come le metriche si muovono nel range selezionato. Picchi o cali temporanei sono
          più facili da individuare senza aprire un report completo.
        </p>
      </section>

      <section>
        <h2>Onboarding Guidato per Nuovi Utenti</h2>
        <p>
          I nuovi account ricevono ora un onboarding passo-passo che copre l’aggiunta dello script di tracking e
          l’esplorazione dei dashboard principali, rendendo la configurazione più rapida e semplice.
        </p>
      </section>

      <section>
        <h2>Core Web Vitals dai Veri Utenti</h2>
        <p>
          Betterlytics ora cattura i Core Web Vitals direttamente dalle sessioni dei visitatori reali, offrendo una
          visione accurata delle performance del sito. Usa queste metriche per identificare e correggere
          regressioni prima che influenzino le conversioni.
        </p>
      </section>
    </>
  );
}
