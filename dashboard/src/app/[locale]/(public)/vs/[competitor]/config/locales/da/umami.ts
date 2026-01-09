import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session replay og overvågning inkluderet',
    description:
      'Sammenlign Betterlytics med Umami. Samme letvægts, privatlivsvenlige analytics – med session replay, brugerrejser og oppetidsovervågning inkluderet. Gratis plan tilgængelig.',
    keywords: [
      'Umami alternativ',
      'Umami Analytics alternativ',
      'privatlivsvenlig analytics',
      'session replay',
      'oppetidsovervågning',
      'letvægts analytics',
      'open source analytics',
    ],
  },
  hero: {
    title: 'Leder du efter et alternativ til Umami?',
    titleHighlight: 'alternativ',
    subtitle:
      'Kan du lide Umamis enkelhed? Få den samme letvægts-, privacy-first analyse – med session replay, brugerrejser og oppetidsovervågning indbygget.',
  },
  keyDifferentiators: [
    {
      title: 'Adfærdsanalyse er indbygget',
      betterlytics:
        'Session replay og sporing af brugerrejser viser præcist, hvordan besøgende interagerer med dit website.',
      competitor:
        'Fokuserer på aggregerede målinger. Ingen mulighed for at se individuel brugeradfærd eller navigationsforløb.',
    },
    {
      title: 'Oppetids- og performanceovervågning',
      betterlytics: 'Følg Core Web Vitals og website-tilgængelighed i samme dashboard som dine analytics.',
      competitor: 'Kun analytics. Oppetids- og performanceovervågning kræver separate værktøjer.',
    },
    {
      title: 'Enklere setup til self-hosting',
      betterlytics: 'Docker-baseret installation med minimal konfiguration. Klar på få minutter.',
      competitor: 'Kræver PostgreSQL eller MySQL samt flere manuelle opsætnings­trin.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privatliv & compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: true },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: true },
          { name: 'EU-datalagring', betterlytics: true, competitor: true },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '~2–3KB' },
          { name: 'Indvirkning på loadtid', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med adblockere', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analysefunktioner',
        features: [
          { name: 'Realtime dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Kampagnesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing af udgående links', betterlytics: true, competitor: true },
          { name: 'Funnel-analyse', betterlytics: true, competitor: true },
          { name: 'Sporing af brugerrejser', betterlytics: true, competitor: true },
          { name: 'Brugerfastholdelse', betterlytics: false, competitor: true },
          { name: 'Annotationer', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performanceovervågning', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervågning', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Let', competitor: 'Let' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Op til 5 år', competitor: 'Kan konfigureres' },
        ],
      },
      {
        name: 'Priser & support',
        features: [
          { name: 'Gratis plan tilgængelig', betterlytics: true, competitor: true },
          { name: 'Gennemsigtig prissætning', betterlytics: true, competitor: true },
          { name: 'Mulighed for self-hosting', betterlytics: true, competitor: true },
          { name: 'E-mail support', betterlytics: true, competitor: 'Kun på betalte planer' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Begge er bygget med fokus på privatliv',
      content: `Umami og Betterlytics deler det samme fundament: cookieless tracking, GDPR-klar som standard og ingen behov for cookie-bannere. Begge værktøjer er bygget med respekt for brugernes privatliv fra bunden.\n\nIngen af dem kræver samtykke-bannere under GDPR. Ingen af dem sælger eller deler dine data. Hvis du forlader Google Analytics af hensyn til privatliv, er begge solide valg. Spørgsmålet er, hvilket funktionsniveau der passer bedst til dine behov.`,
      icon: 'shield',
    },
    {
      title: 'Forstå “hvorfor” bag tallene',
      content: `Umami viser, hvad der skete: sidevisninger, henvisninger, events og konverteringer. Rent og overskueligt.\n\nBetterlytics bygger videre med session replay. Du kan se, hvordan brugere interagerer med dit site, hvor de klikker, scroller og støder på friktion. Ideelt når du vil forstå adfærd – ikke kun tælle besøg.`,
      icon: 'eye',
    },
    {
      title: 'Vær på forkant med nedetid',
      content: `Umami fokuserer udelukkende på analytics. Til oppetid eller performance skal du bruge et separat værktøj.\n\nBetterlytics inkluderer oppetidsovervågning og Core Web Vitals-tracking. Du får besked, når dit site er langsomt eller nede, og kan se performance-data side om side med trafik i samme dashboard.`,
      icon: 'gauge',
    },
    {
      title: 'Hosted eller self-hosted',
      content: `Begge værktøjer understøtter self-hosting. Umami bruger PostgreSQL eller MySQL. Betterlytics bruger Docker med ClickHouse.\n\nFor managed hosting starter Betterlytics ved $6/måned med en gratis plan. Umami Cloud starter ved $20/måned. Begge giver adgang til alle funktioner uden skjulte premium-tilvalg.`,
      icon: 'server',
    },
    {
      title: 'Hvor Umami er stærk',
      content: `Umami er stærk til simpel webanalyse. Det tilbyder rapporter om brugerfastholdelse, offentlige dashboards og har et solidt open source-community.\n\nBetterlytics passer godt, hvis du også vil have session replay, oppetidsovervågning eller performance tracking samlet ét sted. Samme fokus på privatliv – med lidt flere værktøjer inkluderet.`,
      icon: 'target',
    },
  ],
};
