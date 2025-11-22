import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.1',
  releasedAt: '2025-08-11',
  title: 'Accesso Social, Funnel & Avatar Gravatar',
  summary:
    'Questo aggiornamento introduce l’accesso tramite Google e GitHub, nuove analisi funnel per monitorare le perdite e avatar opzionali basati su Gravatar per i workspace.',
};

export default function ReleaseV101ContentIT() {
  return (
    <>
      <section>
        <h2>Accesso con Google & GitHub</h2>
        <p>
          Gli utenti possono ora accedere tramite Google o GitHub per semplificare l’onboarding e velocizzare la
          registrazione.
        </p>
      </section>

      <section>
        <h2>Funnel per Analisi dei Drop-Off</h2>
        <p>
          I funnel sono ora disponibili, permettendo di visualizzare come gli utenti si muovono attraverso percorsi
          multi-step e dove abbandonano. Usali per ottimizzare i flussi di iscrizione, onboarding e altre
          conversioni chiave.
        </p>
      </section>

      <section>
        <h2>Avatar Gravatar</h2>
        <p>
          Gli utenti possono ora abilitare immagini del profilo basate su Gravatar, offrendo avatar semplici e
          riconoscibili senza necessità di caricamento.
        </p>
      </section>
    </>
  );
}
