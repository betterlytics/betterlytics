import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session replay og overvågning inkluderet',
    description:
      'Sammenlign Betterlytics med Umami. Samme letvægts, privatlivsvenlige analytics – plus oppetidsovervågning, statussider og session replay på alle planer. Gratis plan tilgængelig.',
  },
  hero: {
    title: 'Leder du efter et alternativ til Umami?',
    titleHighlight: 'alternativ',
    subtitle:
      'Kan du lide Umamis enkelhed? Få den samme letvægts-, privacy-first analyse – plus oppetidsovervågning, statussider og session replay på alle planer.',
  },
  keyDifferentiators: [
    {
      title: 'Adfærdsanalyse er indbygget',
      betterlytics:
        'Session replay og sporing af brugerrejser viser præcist, hvordan besøgende interagerer med dit website.',
      competitor:
        'Rapporter over brugerrejser på alle planer. På Umami Cloud starter session replays og heatmaps på Business-planen til $200/måned.',
    },
    {
      title: 'Oppetids- og performanceovervågning',
      betterlytics: 'Følg Core Web Vitals og website-tilgængelighed i samme dashboard som dine analytics.',
      competitor: 'Måler Core Web Vitals, men har ingen oppetidsovervågning. Det kræver et separat værktøj.',
    },
    {
      title: 'Enklere setup til self-hosting',
      betterlytics: 'Docker-baseret installation med minimal konfiguration. Klar på få minutter.',
      competitor: 'Kræver PostgreSQL samt flere manuelle opsætnings­trin.',
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
          { name: 'Script-størrelse', betterlytics: '~3,5KB', competitor: '~4KB' },
          { name: 'Indvirkning på loadtid', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med adblockere', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analysefunktioner',
        features: [
          { name: 'Realtime dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Global properties', betterlytics: true, competitor: 'Via session properties' },
          { name: 'Kampagnesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing af udgående links', betterlytics: true, competitor: true },
          { name: 'Funnel-analyse', betterlytics: true, competitor: true },
          { name: 'Sporing af brugerrejser', betterlytics: true, competitor: true },
          { name: 'Brugerfastholdelse', betterlytics: false, competitor: true },
          { name: 'Annotationer', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: 'Fra $200/måned' },
          { name: 'Performanceovervågning', betterlytics: true, competitor: true },
          { name: 'Oppetidsovervågning', betterlytics: true, competitor: false },
          { name: 'Offentlige statussider', betterlytics: true, competitor: false },
          { name: 'Notifikationsintegrationer (Slack, Discord osv.)', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Let', competitor: 'Let' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Op til 5 år', competitor: '6 måneder til 5 år' },
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
      {
        name: 'AI og integrationer',
        features: [
          { name: 'MCP-server', betterlytics: true, competitor: true },
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
      content: `Umami viser, hvad der skete: sidevisninger, henvisninger, events, konverteringer og brugerrejser. Der er også session replays og heatmaps, men på Umami Cloud starter de på Business-planen til $200/måned.\n\nBetterlytics inkluderer session replay på alle planer, også den gratis. Du kan se, hvordan brugere interagerer med dit site, hvor de klikker, scroller og støder på friktion. Ideelt når du vil forstå adfærd – ikke kun tælle besøg.`,
      icon: 'eye',
    },
    {
      title: 'Vær på forkant med nedetid',
      content: `Umami måler Core Web Vitals, men har ingen oppetidsovervågning. Til oppetidstjek og advarsler skal du bruge et separat værktøj.\n\nBetterlytics inkluderer oppetidsovervågning og Core Web Vitals-tracking. Du får advarsler via Slack, Discord, Teams eller webhooks, når dit site er langsomt eller nede, og kan se performance-data side om side med trafik i samme dashboard.`,
      icon: 'gauge',
    },
    {
      title: 'Hosted eller self-hosted',
      content: `Begge værktøjer understøtter self-hosting. Umami kører på PostgreSQL. Betterlytics bruger Docker med ClickHouse.\n\nTil managed hosting har begge en gratis plan. Betalte planer starter ved $7/måned hos Betterlytics og $20/måned hos Umami Cloud. Umami forbeholder session replays og heatmaps Business-planen til $200/måned.`,
      icon: 'server',
    },
    {
      title: 'Hvor Umami er stærk',
      content: `Umami er stærk til simpel webanalyse. Det tilbyder rapporter om brugerfastholdelse, offentlige dashboards og har et solidt open source-community.\n\nBetterlytics passer godt, hvis du også vil have oppetidsovervågning og statussider samlet ét sted, eller session replay uden en plan til $200/måned. Samme fokus på privatliv – med lidt flere værktøjer inkluderet.`,
      icon: 'target',
    },
  ],
};
