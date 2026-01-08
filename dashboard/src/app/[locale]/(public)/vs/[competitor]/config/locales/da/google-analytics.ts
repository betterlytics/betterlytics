import { ComparisonLocaleContent } from '../..';

export const googleAnalytics: ComparisonLocaleContent = {
  name: 'Google Analytics',
  logo: '/tools/google_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Google Analytics: Privatlivsvenligt alternativ',
    description:
      'Sammenlign Betterlytics med Google Analytics. Letvægts, GDPR-klar webanalyse uden cookiebannere, hurtigere sideindlæsning og fuldt ejerskab over dine data. Gratis plan tilgængelig.',
    keywords: [
      'Google Analytics alternativ',
      'GA4 alternativ',
      'privatlivsvenlig analytics',
      'GDPR-kompatibel analytics',
      'cookieless analytics',
      'letvægts webanalyse',
      'Google Analytics erstatning',
    ],
  },
  hero: {
    title: 'Leder du efter et alternativ til Google Analytics?',
    titleHighlight: 'alternativ',
    subtitle:
      'Et lightweight, privacy-first alternativ til Google Analytics. Ingen cookies, ingen bannere, ingen unødvendig kompleksitet.',
  },
  keyDifferentiators: [
    {
      title: 'Ingen cookie-bannere',
      betterlytics: 'Cookieless som standard. Dine besøgende kan browse frit uden afbrydelser.',
      competitor:
        'Kræver typisk samtykkebannere, hvilket kan skade brugeroplevelsen og reducere datakvaliteten, når brugere fravælger.',
    },
    {
      title: 'Lynhurtig',
      betterlytics: '<2KB script der loader øjeblikkeligt uden påvirkning af sidens performance.',
      competitor: '~100KB+ script afhængigt af opsætning. Ofte blokeret af ad blockers.',
    },
    {
      title: 'Dine data, dine regler',
      betterlytics:
        'Du ejer dine data. De deles eller sælges aldrig. Hostet i EU med op til 5 års dataopbevaring.',
      competitor:
        'Google kan bruge aggregerede data til at forbedre annoncering og relaterede services. Begrænset til 14 måneders dataopbevaring.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privatliv & compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: false },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: false },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: false },
          { name: 'EU-hosting af data', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: false },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: false },
          { name: 'Fuld dataejerskab', betterlytics: true, competitor: false },
          { name: 'Open source', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance & hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '~100KB+' },
          { name: 'Indvirkning på sideindlæsning', betterlytics: 'Minimal', competitor: 'Mærkbar' },
          { name: 'Fungerer med ad blockers', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Analytics-funktioner',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Funnel-analyse', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Ingen data-sampling', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '30+ minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Lav', competitor: 'Stejl' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: false },
          { name: 'Ingen kompleks konfiguration', betterlytics: true, competitor: false },
          { name: 'Dataopbevaring', betterlytics: 'Op til 5 år', competitor: '14 måneder' },
        ],
      },
      {
        name: 'Pris & support',
        features: [
          { name: 'Gratis plan tilgængelig', betterlytics: true, competitor: true },
          { name: 'Transparent prissætning', betterlytics: true, competitor: false },
          { name: 'Email-support', betterlytics: true, competitor: 'Limited' },
          { name: 'BigQuery-export', betterlytics: false, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Privatliv der bare fungerer',
      content: `Google Analytics bruger cookies, kræver samtykkebannere under GDPR og har været genstand for afgørelser fra europæiske datatilsyn. Flere EU-myndigheder har rejst bekymringer om dataoverførsler til USA.\n\nBetterlytics er privacy-first fra dag ét. Ingen cookies og ingen samtykkebannere. Alle data hostes i EU. Du er GDPR-klar fra start.`,
      icon: 'shield',
    },
    {
      title: 'Sidehastighed betyder noget',
      content: `Google Analytics-scripts har en størrelse på over 130KB og laver ekstra requests, som kan gøre din side langsommere. Det kan påvirke både SEO og brugeroplevelsen. Det er ofte blokeret af ad blockers og privacy tools, så du mister data alligevel.\n\nVores script er under 2KB og mere end 98% mindre. Det loader asynkront uden påvirkning af sidehastighed. Ad blockers blokerer os ikke, da vi ikke er en del af annonceindustrien, så du får mere komplet data.`,
      icon: 'zap',
    },
    {
      title: 'Din data forbliver din',
      content: `Når du bruger Google Analytics, fungerer Google som databehandler og kan anvende aggregerede data til at forbedre sine services. Din trafik bidrager til deres algoritmer og annonceoptimering.\n\nMed Betterlytics er din data din. Vi hverken deler, sælger eller bruger dem til andet end dine analytics. Vi er ikke i annoncebranchen. Du betaler for en service, og vi leverer den.`,
      icon: 'lock',
    },
    {
      title: 'Simpelt fra dag ét',
      content: `GA4 er komplekst. Datastrømme, events, konverteringer og et forvirrende interface. Indlæringskurven er stejl, og mange hjemmeside-ejere forstår aldrig deres egne analytics fuldt ud.\n\nOpsætning af Betterlytics tager 5 minutter. Tilføj scriptet, og du er i gang. Dashboardet viser de vigtigste metrics i et overskueligt interface. Ingen træning er nødvendigt for at forstå og anvende vores Dashboard.`,
      icon: 'sparkles',
    },
    {
      title: 'Ingen skjulte omkostninger',
      content: `Google Analytics er "gratis", men den skjulte pris er din data. Enterprise-funktioner? GA360 starter typisk i titusindvis af dollars om året.\n\nBetterlytics er transparent og starter fra $6/måned med en gratis plan. Session replay, monitoring og alle funktioner er inkluderet. Ingen overraskelser og ingen datamæssige kompromiser.`,
      icon: 'dollar',
    },
    {
      title: 'Mere end analytics',
      content: `GA fokuserer udelukkende på analytics. Du har brug for separate værktøjer til uptime monitoring, session replay og performance tracking. Flere værktøjer betyder mere kompleksitet.\n\nBetterlytics samler det hele. Analytics, session replay, uptime monitoring og performance tracking. Ét dashboard og én privacy-first platform til alt, du har brug for.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Skift i dag',
    title: 'Klar til at forlade Google Analytics?',
    subtitle: 'Slut dig til tusindvis, der er skiftet til privacy-first analytics uden at miste indsigt.',
    buttonText: 'Start gratis prøveperiode',
  },
};
