import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Live Demo Workspace & Opdateret Landing Page',
  summary:
    'Denne opdatering introducerer et nyt live demo workspace, en redesignet landing page og forbedret intern performance-monitorering for hurtigere og mere stabile dashboards.',
};

export default function ReleaseV124ContentDA() {
  return (
    <>
      <section>
        <h2>Live Demo Workspace</h2>
        <p>Du kan nu udforske Betterlytics via et fuldt interaktivt demo workspace.</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Gennemse dashboards, funnels og tabeller med præ-udfyldte eksempeldata</li>
          <li>Test filtre, opdelinger og sammenligninger uden at røre produktiondata</li>
          <li>Del demoen med kolleger for at vise platformens muligheder</li>
        </ul>
      </section>

      <section>
        <h2>Redesignet Landing Page</h2>
        <p>
          Den offentlige hjemmeside er opdateret med klarere budskaber, nye visuals og forbedret navigation, så
          besøgende nemmere kan forstå, hvad Betterlytics tilbyder.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Opdateret tekst, der fremhæver kernemuligheder som analytics, funnels og session replay</li>
          <li>Nye screenshots, der afspejler produktet korrekt, også på mobil</li>
        </ul>
      </section>

      <section>
        <h2>Forbedret Performance-Monitorering</h2>
        <p>
          Platformens interne performance-telemetri er blevet styrket for hurtigere at opdage problemer og holde
          dashboards responsive.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Hurtigere identifikation af problemer, der påvirker forespørgsler eller loading-tid</li>
          <li>Mere indsigt i miljøadfærd for en mere stabil oplevelse</li>
          <li>Et stærkere fundament for løbende performance-forbedringer</li>
        </ul>
      </section>
    </>
  );
}
