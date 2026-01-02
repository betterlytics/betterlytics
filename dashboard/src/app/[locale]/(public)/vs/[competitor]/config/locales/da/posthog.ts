import { ComparisonLocaleContent } from '../..';

export const posthog: ComparisonLocaleContent = {
  name: 'PostHog',
  logo: '/tools/posthog-logo.svg',
  hero: {
    title: 'Leder du efter et alternativ til PostHog?',
    titleHighlight: 'alternativ',
    subtitle:
      'Betterlytics giver dig fokuserede, lightweight web analytics med simpel prissætning og et minimalt footprint. Til teams, der vil have klarhed frem for kompleksitet.',
  },
  keyDifferentiators: [
    {
      title: 'Ægte lightweight',
      betterlytics: '<2KB script, designet til minimal påvirkning af sideperformance.',
      competitor: '~57KB script med et bredt funktionssæt og større load overhead.',
    },
    {
      title: 'Privatliv som standard',
      betterlytics: 'Cookieless fra designet. Ingen cookie-bannere nødvendige.',
      competitor: 'Bruger cookies som standard. Cookieless mode er muligt med konfiguration.',
    },
    {
      title: 'Simpel og forudsigelig prissætning',
      betterlytics: 'Gratis plan til små sites. Betalte planer fra $6/måned med kernefunktioner inkluderet.',
      competitor:
        'Generøs gratis plan, men forbrugsbaseret prissætning på tværs af flere produkter bliver kompleks ved skalering.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privatliv & compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: 'Med konfiguration' },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: 'Afhænger af opsætning' },
          { name: 'EU-hosting af data', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: false },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Fuld dataejerskab', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Mulighed for self-hosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '~57KB' },
          { name: 'Indvirkning på sideindlæsning', betterlytics: 'Minimal', competitor: 'Moderat' },
          { name: 'Fungerer med ad blockers', betterlytics: true, competitor: 'Delvist' },
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
          { name: 'Session replay', betterlytics: true, competitor: true },
          { name: 'Core Web Vitals', betterlytics: true, competitor: true },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Feature flags', betterlytics: false, competitor: true },
          { name: 'A/B testing', betterlytics: false, competitor: true },
          { name: 'Surveys (NPS/CSAT)', betterlytics: false, competitor: true },
          { name: 'Heatmaps', betterlytics: false, competitor: true },
          { name: 'Mobile app analytics', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: 'Længere opsætning' },
          { name: 'Indlæringskurve', betterlytics: 'Lav', competitor: 'Moderat' },
          { name: 'Simpelt, analytics-fokuseret interface', betterlytics: true, competitor: false },
          { name: 'Minimal konfiguration nødvendig', betterlytics: true, competitor: false },
          { name: 'Dataopbevaring', betterlytics: 'Op til 5 år', competitor: 'Op til 7 år' },
        ],
      },
      {
        name: 'Pris & support',
        features: [
          { name: 'Gratis plan tilgængelig', betterlytics: true, competitor: true },
          { name: 'Forudsigelig prissætning', betterlytics: true, competitor: false },
          { name: 'Email-support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Fokus kontra alt-i-én',
      content: `PostHog samler mange funktioner i én platform. Product analytics, feature flags, A/B testing, session replay, surveys og mere. Det er stærkt for større produktteams, der har brug for det hele. Men hvis du primært vil have web analytics, risikerer du at betale for funktioner, du ikke bruger.\n\nBetterlytics fokuserer på analytics og gør det rigtig godt. Session replay, funnels, user journeys og performance monitoring. Du er i gang på 5 minutter, uden at skulle være ekspert i product analytics.`,
      icon: 'target',
    },
    {
      title: 'Sidehastighed betyder noget',
      content: `PostHogs script er omkring 57KB gzippet. Det inkluderer understøttelse af feature flags, session recording, autocapture og andre produktfunktioner. På mobil og langsommere forbindelser kan det mærkes.\n\nVores script er under 2KB. Dine sider forbliver hurtige, Core Web Vitals forbliver grønne, og SEO har det godt. Analytics bør ikke gøre dit site langsommere.`,
      icon: 'zap',
    },
    {
      title: 'Privatliv fra start',
      content: `PostHog bruger cookies som standard. Du kan konfigurere cookieless mode, men det kræver ekstra opsætning og kan begrænse visse funktioner. I standardopsætning betyder det ofte, at et samtykke-banner er nødvendigt for GDPR-compliance.\n\nBetterlytics er cookieless fra start. Ingen konfiguration, ingen cookie-bannere og ingen irriterende popups for dine besøgende.`,
      icon: 'shield',
    },
    {
      title: 'Vid hvad du betaler',
      content: `PostHog afregner separat for events, session recordings, feature flags, surveys og mere. Den gratis plan er generøs, men omkostningerne kan stige hurtigt, når dit brug vokser. Det gør de månedlige udgifter sværere at forudsige.\n\nHos os er det enkelt. Fast prissætning fra $6/måned med klare grænser. Session replay, monitoring og kerne-analytics er alle inkluderet. Du kan forstå din regning uden at skulle bruge et regneark.`,
      icon: 'dollar',
    },
    {
      title: 'Hvor PostHog er stærk',
      content: `PostHog er stærk på feature flags, A/B testing og produkt-eksperimenter. Hvis du kører eksperimenter og har brug for detaljeret feature-kontrol, er det svært at slå.\n\nMen hvis du vil have rene web analytics med session replay og uptime monitoring, uden at lære en helt ny platform, er det her vi skiller os ud. Vi er virkelig gode til analytics. PostHog er god til rigtig mange andre ting også.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Hold det enkelt',
    title: 'Vil du have analytics uden besvær?',
    subtitle: 'Fokuseret webanalyse. Letvægts-script. Forudsigelige priser.',
    buttonText: 'Start gratis prøveperiode',
  },
};
