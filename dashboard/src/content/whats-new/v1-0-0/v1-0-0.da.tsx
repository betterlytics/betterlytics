import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.0',
  releasedAt: '2025-08-01',
  title: 'Betterlytics 1.0 Lancering + To-Faktor Autentifikation',
  summary:
    'Den første stabile version af Betterlytics introducerer en pålidelig analysetjeneste samt valgfri to-faktor autentifikation (TOTP) for øget kontosikkerhed.',
};

export default function ReleaseV100ContentDA() {
  return (
    <>
      <section>
        <h2>Betterlytics 1.0</h2>
        <p>
          Version 1.0 markerer den første stabile udgivelse af Betterlytics og samler kerneoplevelsen af
          dashboardet i et produkt klar til produktion for teams, der værdsætter privatlivsvenlig analyse.
        </p>
      </section>

      <section>
        <h2>To-Faktor Autentifikation (TOTP)</h2>
        <p>
          Brugere kan nu aktivere tidsbaserede engangskoder (TOTP) for deres konti, hvilket giver et ekstra
          sikkerhedslag oven på adgangskoder. Enhver standard autentifikationsapp kan bruges.
        </p>
      </section>
    </>
  );
}
