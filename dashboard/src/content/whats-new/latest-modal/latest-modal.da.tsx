import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.5',
  releasedAt: '2025-11-23',
  title: 'Skarpere funnels, renere data',
  summary: 'En fuldt redesignet funnels-oplevelse, forbedret dataintegritet og en række stabilitetsforbedringer.',
};

export default function LatestWhatsNewContentDa() {
  return (
    <>
      <section>
        <h2>Nye funktioner</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Sammenlign perioder direkte i verdenskort-visualiseringen.</li>
          <li>
            Bloker events fra specifikke IP-adresser for at undgå skæve eller uønskede besøg (f.eks. dine egne).
          </li>
          <li>Afvis automatisk events fra domæner, der ikke matcher dit dashboard-domæne.</li>
        </ul>
      </section>

      <section>
        <h2>Forbedringer</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Funnels er helt redesignet for en bedre oplevelse og visualisering.</li>
          <li>Core Web Vitals-labels er gjort klarere og mere forståelige.</li>
          <li>Antarktis skjules fra verdenskortet, medmindre der er besøgsdata.</li>
          <li>Tilføjet en &ldquo;Rapportér en bug&rdquo;-knap direkte i appen.</li>
        </ul>
      </section>

      <section>
        <h2>Bugfixes</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Fikset et problem, der kunne forhindre Core Web Vitals-siden i at loade.</li>
          <li>Løst sommertid-problemer, der påvirkede viste analyser.</li>
        </ul>
      </section>
    </>
  );
}
