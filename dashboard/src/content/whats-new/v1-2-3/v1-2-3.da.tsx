import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Smartere Søgning, Klarere Filtre & Stabilitetsforbedringer',
  summary:
    'Denne opdatering introducerer forbedret søgning og filtrering, mere informative visualiseringer, bedre session replay og flere stabilitets- og UX-forbedringer.',
};

export default function ReleaseV123ContentDA() {
  return (
    <>
      <section>
        <h2>Forbedret Søgning & Filtre</h2>
        <p>
          Søgning og filtrering skalerer nu bedre med store datasæt, hvilket gør det nemmere at finde den
          information, du har brug for.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Rige søgefunktioner til hurtigt at finde vigtige events, sider og egenskaber</li>
          <li>Mere responsive oversigtstabeller med passende begrænsninger for store workspaces</li>
          <li>Filtre gemmes i URL’en, så filtrerede visninger nemt kan bogmærkes og deles</li>
          <li>Rettelser til filtervalg og hierarkiske tabeller for mere pålidelige opdelinger</li>
        </ul>
      </section>

      <section>
        <h2>Mere Kontekst i Visualiseringer</h2>
        <p>
          Flere visuelle komponenter viser nu ekstra detaljer, så du kan tolke trends hurtigere og med færre klik.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Udvidelige enhedsdetaljer med specifikke browsere og platforme</li>
          <li>Ugentlige heatmaps med hover-værktøjstip, der viser præcise tal og tidspunkter</li>
          <li>“Ingen ændring”-resuméer, der tydeligt fremhæver stabile sammenligningsperioder</li>
        </ul>
      </section>

      <section>
        <h2>Forbedringer af Session Replay</h2>
        <p>
          Session replays er nu mere pålidelige og præcise, så du trygt kan gennemgå brugerinteraktioner uden at
          misse vigtige handlinger.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Mere pålidelige og nøjagtige optagelser af brugerinteraktioner</li>
          <li>Forbedret afspilning af sessioner, så vigtige handlinger fanges korrekt</li>
        </ul>
      </section>

      <section>
        <h2>Tidszonejustering af Dashboards</h2>
        <p>Dashboards viser nu hver brugers lokale tid for mere intuitiv rapportering</p>
      </section>
    </>
  );
}
