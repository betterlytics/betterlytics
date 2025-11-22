import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.2',
  releasedAt: '2025-10-20',
  title: 'Privatlivsfokuseret Session Replay & Hurtigere Dashboards',
  summary:
    'Denne opdatering introducerer anonymiseret session replay, forbedret ydeevne på dashboards og opdaterede oversættelser for en bedre global oplevelse.',
};

export default function ReleaseV122ContentDA() {
  return (
    <>
      <section>
        <h2>Privatlivsfokuseret Session Replay</h2>
        <p>
          Session replay er nu tilgængelig og viser anonymiserede optagelser af, hvordan besøgende interagerer med
          dit site. Følsomme oplysninger, som tekst, formularfelter og billeder, maskeres automatisk for at
          beskytte brugerens privatliv.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Se, hvor brugerne tøver, scroller eller forlader siden</li>
          <li>Identificer frustrationer som rage clicks</li>
          <li>Del optagelser med dit team uden at eksponere personlige data</li>
        </ul>
      </section>

      <section>
        <h2>Hurtigere og Smidigere Dashboards</h2>
        <p>
          Vi har reduceret unødvendige gen-renderinger i kernesiderne, så dashboards føles hurtigere, især i større
          workspaces. Navigering mellem rapporter og brug af filtre er nu mere responsivt.
        </p>
      </section>

      <section>
        <h2>Forbedrede Oversættelser</h2>
        <p>
          Manglende oversættelser og inkonsekvent tekst er blevet opdateret, hvilket giver en mere poleret og
          ensartet oplevelse for internationale teams.
        </p>
      </section>
    </>
  );
}
