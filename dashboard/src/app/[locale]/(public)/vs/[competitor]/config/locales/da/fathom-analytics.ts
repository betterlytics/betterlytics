import { ComparisonLocaleContent } from '../..';

export const fathom: ComparisonLocaleContent = {
  name: 'Fathom Analytics',
  logo: '/tools/fathom_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Fathom Analytics: Flere funktioner til lavere pris',
    description:
      'Sammenlign Betterlytics med Fathom Analytics. Samme privatlivsvenlige tilgang med session replay, funnels, brugerrejser og uptime-monitoring inkluderet. Gratis plan tilgængelig.',
    keywords: [
      'Fathom Analytics alternativ',
      'Fathom alternativ',
      'privatlivsvenlig analytics',
      'session replay',
      'funnel-analyse',
      'billig webanalyse',
      'GDPR-kompatibel analytics',
    ],
  },
  hero: {
    title: 'Leder du efter et alternativ til Fathom Analytics?',
    titleHighlight: 'alternativ',
    subtitle:
      'Få de samme privacy-first analytics plus session replay, funnels og user journey tracking. Flere indsigter til en lavere pris.',
  },
  keyDifferentiators: [
    {
      title: 'Session Replay inkluderet',
      betterlytics: 'Se rigtige brugersessioner for at forstå adfærd og identificere problemer.',
      competitor: 'Ingen session replay. Begrænset til aggregerede analytics.',
    },
    {
      title: 'Funnel- og Journey-analyse',
      betterlytics: 'Funnels med flere trin og user journey tracking til at forstå konverteringsflows.',
      competitor: 'Ingen funnel- eller journey-analyse. Kun basal event tracking.',
    },
    {
      title: 'Lavere startpris',
      betterlytics: 'Starter fra $6/måned med en gratis plan til mindre websites.',
      competitor: 'Starter fra $15/måned. Ingen gratis plan.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privatliv & Compliance',
        features: [
          { name: 'Cookieless tracking', betterlytics: true, competitor: true },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: true },
          { name: 'EU-hosting af data', betterlytics: true, competitor: 'Valgfrit' },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: false },
          { name: 'Mulighed for self-hosting', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance & Hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Indvirkning på sideindlæsning', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med ad blockers', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analytics-funktioner',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracking af udgående links', betterlytics: true, competitor: true },
          { name: 'Funnel-analyse', betterlytics: true, competitor: false },
          { name: 'User journey tracking', betterlytics: true, competitor: false },
          { name: 'Annotationer', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Import af GA-data', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Lav', competitor: 'Lav' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: true },
          { name: 'Dataopbevaring', betterlytics: 'Op til 5 år', competitor: 'For evigt' },
        ],
      },
      {
        name: 'Pris & Support',
        features: [
          { name: 'Gratis plan tilgængeligt', betterlytics: true, competitor: false },
          { name: 'Startpris', betterlytics: 'Fra $6/måned', competitor: 'Fra $15/måned' },
          { name: 'Transparent prissætning', betterlytics: true, competitor: true },
          { name: 'Email-support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Samme privatlivsfilosofi',
      content: `Fathom og Betterlytics deler samme DNA: privacy-first, lightweight og uden behov for cookie-bannere. Begge er cookieless og designet til at være GDPR-klar som standard. Vil du væk fra Google Analytics? Begge er solide valg.\n\nForskellen ligger i dybden. Vi inkluderer session replay, funnel-analyse og user journey tracking. Ikke kun hvad der skete – men hvordan og hvorfor brugerne agerer, som de gør.`,
      icon: 'shield',
    },
    {
      title: 'Mere end aggregerede tal',
      content: `Fathom viser pageviews, referrers og basale events. Rent og enkelt. Men når du vil vide, hvorfor brugere falder fra, eller hvordan de reelt bruger dit site, er du begrænset til tal.\n\nBetterlytics inkluderer session replay, så du kan se rigtige brugersessioner, funnels til at tracke konverteringsflows og journey-visualisering til at forstå navigation. Problemer og muligheder, som tal alene ikke afslører.`,
      icon: 'eye',
    },
    {
      title: 'Pris vs. værdi',
      content: `Fathom starter fra $15/måned for 100.000 pageviews. Intet gratis plan, og betaling kræves for at komme i gang.\n\nBetterlytics starter fra $6/måned – næsten 60% billigere – med en gratis plan til mindre websites. Du får flere funktioner (session replay, funnels og journeys) til en lavere pris. Begge har transparent prissætning.`,
      icon: 'dollar',
    },
    {
      title: 'Hvor Fathom er stærk',
      content: `Fathom tilbyder ubegrænset dataopbevaring (vi gemmer op til 5 år), en GA4-importer til migrering af historiske data og custom domains for at reducere ad blocker-interferens. De har eksisteret længere og har et solidt track record.\n\nMen hvis du vil have session replay, funnels, user journeys og mere – til en lavere pris og med en gratis plan til at starte – tilbyder vi bedre værdi.`,
      icon: 'target',
    },
  ],
};
