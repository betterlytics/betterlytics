import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.0',
  releasedAt: '2025-08-01',
  title: 'Betterlytics 1.0 + Autenticazione a Due Fattori',
  summary:
    'La prima versione stabile di Betterlytics introduce un’esperienza analitica affidabile insieme all’autenticazione a due fattori (TOTP) opzionale per una maggiore sicurezza dell’account.',
};

export default function ReleaseV100ContentIT() {
  return (
    <>
      <section>
        <h2>Betterlytics 1.0</h2>
        <p>
          La versione 1.0 segna la prima release stabile di Betterlytics, raggruppando l’esperienza principale del
          dashboard in un prodotto pronto per la produzione per team che privilegiano analisi rispettose della
          privacy.
        </p>
      </section>

      <section>
        <h2>Autenticazione a Due Fattori (TOTP)</h2>
        <p>
          Gli utenti possono ora abilitare password monouso temporizzate (TOTP) per i loro account, aggiungendo un
          ulteriore livello di sicurezza oltre alla password. Qualsiasi app di autenticazione standard può essere
          utilizzata.
        </p>
      </section>
    </>
  );
}
