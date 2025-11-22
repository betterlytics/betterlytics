import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.1.0',
  releasedAt: '2025-08-15',
  title: 'Lokaliserede Dashboards, Smartere Kort & Flere Sammenligninger',
  summary:
    'Dashboards er nu tilgængelige på flere sprog, verdenskortet er lettere at udforske, og sammenligningsværdier vises i flere diagrammer og fremdriftsindikatorer.',
};

export default function ReleaseV110ContentDA() {
  return (
    <>
      <section>
        <h2>Dashboard Lokalisering</h2>
        <p>
          Alle hovedsider i dashboardet er nu lokaliserede, så teams kan navigere, læse etiketter og se metrics på
          deres foretrukne sprog.
        </p>
      </section>

      <section>
        <h2>Forbedrede Verdenskort-Interaktioner</h2>
        <p>
          Verdenskortet er blevet forbedret, så regioner er lettere at holde musen over, vælge og sammenligne.
          Mindre eller tæt pakkede områder reagerer nu mere jævnt, og regionale grupperinger er tydeligere ved
          første blik.
        </p>
      </section>

      <section>
        <h2>Udvidede Sammenligningsværdier</h2>
        <p>
          Flere diagrammer og fremdriftsbjælker inkluderer nu hover-værktøjer med sammenligningsværdier, så det er
          nemmere at se, hvordan den aktuelle performance står i forhold til baseline uden at skifte visning.
        </p>
      </section>
    </>
  );
}
