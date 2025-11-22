import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.2',
  releasedAt: '2025-10-20',
  title: 'Session Replay Privacy-First & Dashboard più Veloci',
  summary:
    'Questa versione introduce session replay anonimizzato, miglioramenti delle performance dei dashboard e traduzioni aggiornate per un’esperienza globale più fluida.',
};

export default function ReleaseV122ContentIT() {
  return (
    <>
      <section>
        <h2>Session Replay Privacy-First</h2>
        <p>
          Il session replay è ora disponibile e mostra registrazioni anonimizzate di come i visitatori
          interagiscono con il tuo sito. Informazioni sensibili come testo, campi dei moduli e immagini vengono
          automaticamente mascherate per proteggere la privacy degli utenti.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Comprendere dove gli utenti esitano, scorrono o abbandonano la pagina</li>
          <li>Individuare segnali di frustrazione come i rage click</li>
          <li>Condividere le registrazioni con il team senza esporre dati personali</li>
        </ul>
      </section>

      <section>
        <h2>Dashboard più Veloci e Fluidi</h2>
        <p>
          Abbiamo ridotto i rendering non necessari nelle viste principali, rendendo i dashboard più reattivi,
          specialmente nei workspace più grandi. Navigare tra i report e applicare filtri ora è più veloce.
        </p>
      </section>

      <section>
        <h2>Miglioramenti nelle Traduzioni</h2>
        <p>
          Le traduzioni mancanti e le incoerenze nel testo sono state aggiornate, offrendo un’esperienza più
          uniforme e rifinita per i team internazionali.
        </p>
      </section>
    </>
  );
}
