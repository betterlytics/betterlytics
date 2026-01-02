import { ComparisonLocaleContent } from '../..';

export const matomo: ComparisonLocaleContent = {
  name: 'Matomo Cloud',
  logo: '/tools/matomo-logo.svg',
  hero: {
    title: 'Leder du efter et alternativ til Matomo?',
    titleHighlight: 'alternativ',
    subtitle:
      'Få moderne, lightweight analytics uden kompleksiteten. Ingen serveradministration og intet plugin-besvær.',
  },
  keyDifferentiators: [
    {
      title: 'Moderne arkitektur',
      betterlytics: 'Bygget fra bunden til det moderne web. Session replay og monitoring inkluderet som standard.',
      competitor: 'Startede i 2007 som Piwik. En moden platform med mange funktioner leveret via plugins.',
    },
    {
      title: 'Ingen plugins nødvendige',
      betterlytics: 'Analytics, session replay og monitoring er inkluderet. Ét værktøj og én pris.',
      competitor: 'Kerne-analytics er gratis, men session recording og heatmaps kræver betalte add-ons.',
    },
    {
      title: 'Simpel prissætning',
      betterlytics: 'Gratis plan tilgængelig. Betalte planer fra $6/måned med alt inkluderet.',
      competitor:
        'Self-hosted kræver infrastruktur og vedligeholdelse. Cloud-planer starter højere med betalte add-ons.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privatliv & compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: 'Med konfiguration' },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: 'Med konfiguration' },
          { name: 'EU-hosting af data', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Fuld dataejerskab', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Mulighed for self-hosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '~23KB' },
          { name: 'Indvirkning på sideindlæsning', betterlytics: 'Minimal', competitor: 'Moderat' },
          { name: 'Fungerer med ad blockers', betterlytics: true, competitor: 'Limited' },
        ],
      },
      {
        name: 'Analytics-funktioner',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: 'Limited' },
          { name: 'Funnel-analyse', betterlytics: true, competitor: 'Med add-on' },
          { name: 'Session replay', betterlytics: true, competitor: 'Med add-on' },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Lav', competitor: 'Moderat' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: false },
          { name: 'Ingen kompleks konfiguration', betterlytics: true, competitor: false },
          { name: 'Dataopbevaring', betterlytics: 'Op til 5 år', competitor: 'Op til 2 år' },
        ],
      },
      {
        name: 'Pris & support',
        features: [
          { name: 'Gratis plan tilgængelig', betterlytics: true, competitor: false },
          { name: 'Transparent prissætning', betterlytics: true, competitor: 'Limited' },
          { name: 'Email-support', betterlytics: true, competitor: 'Betalt' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Bygget til det moderne web',
      content: `Matomo startede som Piwik i 2007, hvor webbet så anderledes ud. Platformen er modnet over tid, men bærer stadig præg af ældre arkitektur. Funktioner er løbende blevet tilføjet, nogle som plugins og andre direkte i platformen.\n\nBetterlytics er designet fra bunden til det moderne web. Lightweight som standard, session replay inkluderet og optimeret til Core Web Vitals. Ingen legacy-kompleksitet, bare rene analytics bygget til nutidens web.`,
      icon: 'sparkles',
    },
    {
      title: 'Privatliv uden konfiguration',
      content: `Matomo kan konfigureres til cookieless tracking og GDPR-compliance. Det fungerer godt, når det er sat korrekt op. Men opsætningen kræver tid, og løbende compliance kræver vedligeholdelse.\n\nBetterlytics er privacy-first fra start. Cookieless som standard, GDPR-klar uden konfiguration og alt data er hostet i EU. Du får fordelene uden at skulle læse lange konfigurationsguides.`,
      icon: 'shield',
    },
    {
      title: 'Den reelle pris på "gratis"',
      content: `Matomos self-hosted version er gratis at downloade, men du betaler med serveromkostninger, vedligeholdelse og premium plugins som session recording. Matomo Cloud starter fra $19/måned og skalerer med pageviews.\n\nBetterlytics tilbyder en gratis plan til mindre sites. Betalte planer starter fra $6/måned med alt inkluderet. Session replay, monitoring og ingen add-on-gebyrer. Det, du ser, er det, du betaler.`,
      icon: 'dollar',
    },
    {
      title: 'Alt samlet ét sted',
      content: `Matomo har omfattende analytics, men session recording er et betalt plugin, og uptime monitoring er ikke inkluderet. Interfacet er kraftfuldt, men kan føles overvældende.\n\nBetterlytics samler analytics, session replay, uptime monitoring og performance tracking ét sted. Ét overskueligt interface, ingen plugins der skal købes, og ingen paywalls på betalte planer.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Simplify Your Stack',
    title: 'Ready for Analytics Without the Complexity?',
    subtitle: 'No plugins. No server maintenance. Just clean analytics that works.',
    buttonText: 'Start Free Trial',
  },
};
