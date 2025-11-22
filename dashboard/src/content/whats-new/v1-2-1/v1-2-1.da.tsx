import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.1',
  releasedAt: '2025-09-22',
  title: 'Smartere Tidsintervaller & Mere Præcise Oversigtsmålinger',
  summary:
    'Denne opdatering tilføjer flere tids- og sammenligningsmuligheder, retter inkonsekvenser i oversigtsmålinger og forbedrer tilgængelighed samt mobilbrugervenlighed.',
};

export default function ReleaseV121ContentDA() {
  return (
    <>
      <section>
        <h2>Smartere Tids- & Sammenligningsintervaller</h2>
        <p>
          Tidsintervaller tilbyder nu flere forudindstillede muligheder og tydeligere sammenligningsvalg, så du kan
          besvare almindelige rapporteringsspørgsmål hurtigere.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>
            Skift hurtigt til intervaller som sidste 24 timer, sidste 7 dage, sidste 14 dage eller sidste kvartal.
          </li>
          <li>
            Sammenlign ydeevne med foregående periode eller sidste år, med mulighed for at justere ugedage for
            renere sammenligninger.
          </li>
          <li>Tids- og sammenligningsvælgere er nu separate for bedre klarhed og kontrol.</li>
        </ul>
      </section>

      <section>
        <h2>Mere Præcise Oversigtsmålinger</h2>
        <p>Flere forbedringer sikrer mere pålidelige rapporter på oversigtssiden.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Summary-kort viser nu værdier fuldt synkroniseret med underliggende diagrammer og tabeller.</li>
          <li>
            Pageview-tælling er blevet forbedret, så inaktive faner i baggrunden ikke længere øger totalsummen.
          </li>
        </ul>
      </section>

      <section>
        <h2>Forbedret Tilgængelighed & Mobilbrugervenlighed</h2>
        <p>
          Vi har fortsat med at forbedre den samlede brugervenlighed i Betterlytics, især for login og for teams på
          mindre skærme.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Login-formularer fungerer nu bedre med tastaturnavigation og hjælpemidler.</li>
          <li>Mobil-layouts er forbedret, så dashboards og kontroller er lettere at bruge på små skærme.</li>
        </ul>
      </section>
    </>
  );
}
