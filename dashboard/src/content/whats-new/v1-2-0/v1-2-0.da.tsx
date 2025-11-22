import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.0',
  releasedAt: '2025-09-14',
  title: 'Ugentligt Heatmap, Nyt UI & Core Web Vitals',
  summary:
    'Denne opdatering introducerer en komplet redesign af Betterlytics-websitet, et ugentligt engagement-heatmap, opdaterede oversigtsmålinger, guidet onboarding for nye workspaces og Core Web Vitals baseret på rigtige brugere.',
};

export default function ReleaseV120ContentDA() {
  return (
    <>
      <section>
        <h2>Komplet Website- & Dashboard-Redesign</h2>
        <p>
          Hele websitet og alle dashboards er blevet opdateret med et nyt visuelt tema, ensartede farver,
          konsekvent typografi og forbedret layout. Navigation, tabeller, diagrammer, dialoger og værktøjstip er
          blevet finjusteret for en renere og mere intuitiv oplevelse på både desktop og mobil.
        </p>
      </section>

      <section>
        <h2>Ugentligt Engagement-Heatmap</h2>
        <p>
          Oversigtssiden inkluderer nu et ugentligt heatmap, der viser trafikmønstre efter dag og time. Spot
          hurtigt spidsperioder, stille timer og usædvanlige aktivitetstoppe.
        </p>
      </section>

      <section>
        <h2>Mere Kontekst i Oversigtsdiagrammer</h2>
        <p>
          To nye målekort er blevet tilføjet til oversigtsdiagrammet: samlet sessionsantal og gennemsnitlig
          besøgsvarighed. Det gør det nemmere at koble højniveau trafiktrends med, hvor længe folk faktisk bliver
          på dit site.
        </p>
      </section>

      <section>
        <h2>Mere Detaljerede Sparkline-Trends</h2>
        <p>
          Sparkline-grafik i oversigtskortene understøtter nu mere finmasket tidsintervaller, hvilket giver et
          klarere overblik over, hvordan målinger bevæger sig inden for det valgte interval. Korte udsving og fald
          er lettere at spotte uden at åbne en fuld rapport.
        </p>
      </section>

      <section>
        <h2>Guidet Onboarding for Nye Brugere</h2>
        <p>
          Nye konti får nu en trin-for-trin onboarding, der dækker tilføjelse af tracking-scriptet og udforskning
          af kernedashboards, hvilket gør opsætning hurtigere og mere overskuelig.
        </p>
      </section>

      <section>
        <h2>Core Web Vitals fra Rigtige Brugere</h2>
        <p>
          Betterlytics indsamler nu Core Web Vitals direkte fra rigtige besøgs-sessioner, hvilket giver et
          nøjagtigt billede af site-performance. Brug disse målinger til at opdage og rette regressionsproblemer,
          før de påvirker konverteringer.
        </p>
      </section>
    </>
  );
}
