import { ComparisonLocaleContent } from '../..';

export const plausible: ComparisonLocaleContent = {
  name: 'Plausible',
  logo: '/tools/plausible-logo.png',
  seo: {
    title: 'Betterlytics vs Plausible: Flere funktioner, samme privatliv',
    description:
      'Sammenlign Betterlytics med Plausible. Samme privatlivsvenlige tilgang plus session replay, brugerrejser og overvågning. Gratis plan tilgængelig, ingen bindinger.',
    keywords: [
      'Plausible alternativ',
      'Plausible Analytics alternativ',
      'privatlivsvenlig analytics',
      'session replay',
      'brugerrejse tracking',
      'letvægts analytics',
      'GDPR-kompatibel analytics',
    ],
  },
  hero: {
    title: 'Leder du efter et alternativ til Plausible?',
    titleHighlight: 'alternativ',
    subtitle:
      'Alt det Plausible tilbyder, plus session replay, user journeys, monitoring og mere. Samme privacy-first tilgang, dybere indsigt.',
  },
  keyDifferentiators: [
    {
      title: 'Session replay inkluderet',
      betterlytics: 'Se rigtige brugersessioner for at forstå adfærd og rette problemer.',
      competitor: 'Ingen session replay. Privacy-fokuseret, men begrænser indsigt i brugeradfærd.',
    },
    {
      title: 'User journey tracking',
      betterlytics: 'Visualisér hvordan brugere bevæger sig gennem din hjemmeside side for side.',
      competitor: 'Kun funnel-analyse. Ingen visualisering af individuelle user journeys.',
    },
    {
      title: 'Indbygget monitoring',
      betterlytics: 'Uptime monitoring og performance tracking er inkluderet.',
      competitor: 'Kun analytics. Monitoring kræver separate værktøjer.',
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
          { name: 'EU-hosting af data', betterlytics: true, competitor: true },
          { name: 'Privacy-first som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance & hastighed',
        features: [
          { name: 'Script-størrelse', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Indvirkning på sideindlæsning', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med ad blockers', betterlytics: true, competitor: 'Delvist' },
        ],
      },
      {
        name: 'Analytics-funktioner',
        features: [
          { name: 'Real-time dashboard', betterlytics: true, competitor: true },
          { name: 'Custom events', betterlytics: true, competitor: true },
          { name: 'Funnel-analyse', betterlytics: true, competitor: true },
          { name: 'Campaign tracking (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracking af udgående links', betterlytics: true, competitor: true },
          { name: 'User journey tracking', betterlytics: true, competitor: false },
          { name: 'Annotationer', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Performance monitoring', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brugervenlighed',
        features: [
          { name: 'Opsætningstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Indlæringskurve', betterlytics: 'Lav', competitor: 'Lav' },
          { name: 'Simpelt og intuitivt interface', betterlytics: true, competitor: true },
          { name: 'Ingen kompleks konfiguration', betterlytics: true, competitor: true },
          { name: 'Dataopbevaring', betterlytics: 'Op til 5 år', competitor: 'Ubegrænset' },
        ],
      },
      {
        name: 'Pris & support',
        features: [
          { name: 'Gratis plan tilgængelig', betterlytics: true, competitor: false },
          { name: 'Transparent prissætning', betterlytics: true, competitor: true },
          { name: 'Mulighed for self-hosting', betterlytics: true, competitor: true },
          { name: 'Email-support', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Samme værdier, forskellige værktøjer',
      content: `Plausible og Betterlytics deler samme DNA. Privacy-first, lightweight, ingen cookies og GDPR-klar fra start. Begge er stærke alternativer til Google Analytics, hvis privatliv er vigtigt for dig.\n\nForskellen er værktøjssættet. Betterlytics inkluderer session replay, user journey tracking og monitoring. Plausible holder bevidst tingene minimale. Hvis du har brug for indsigt ud over pageviews og konverteringer, dækker vi behovet.`,
      icon: 'shield',
    },
    {
      title: 'Session replay med respekt for privatliv',
      content: `Plausible fravælger session replay for at være så privat som muligt. Det er et bevidst valg, men betyder også, at du ikke kan se, hvor brugere klikker, hvor de sidder fast, eller hvorfor de forlader siden.\n\nVi inkluderer session replay og forbliver cookieless og privacy-compliant. Ingen cross-site tracking, og du har fuld kontrol over, hvad der bliver optaget. Den adfærdsindsigt, du har brug for, kombineret med stærke privatlivsgarantier.`,
      icon: 'eye',
    },
    {
      title: 'Ét værktøj i stedet for tre',
      content: `Plausible leverer stærke kerne-analytics. Pageviews, referrers, konverteringer og funnels i et rent og fokuseret interface. Men når du har brug for uptime monitoring eller performance tracking, kræver det ekstra værktøjer.\n\nBetterlytics samler analytics, session replay, user journeys, ydeenve-indsigter og monitoring ét sted. Ét dashboard, én regning og samme privacy-standard på tværs af det hele.`,
      icon: 'layers',
    },
    {
      title: 'Prisoverblik',
      content: `Plausible starter fra $9/måned for 10.000 pageviews. Der er ingen gratis plan på hosted versionen, men self-hosting er gratis, hvis du selv håndterer infrastrukturen.\n\nBetterlytics starter fra $6/måned med en gratis plan til mindre sites. Session replay, monitoring, ydeenve-indsigter og user journeys er alle inkluderet. Flere funktioner og en lavere startpris.`,
      icon: 'dollar',
    },
    {
      title: 'Hvor Plausible er stærk',
      content: `Plausible er fuldt open source, og du kan gennemgå hver linje kode. Self-hosting giver fuld kontrol over dine data, og deres script er marginalt mindre i gennemsnit.\n\nHvis open source og self-hosting er ufravigelige krav, er Plausible et fremragende valg. Men hvis du ønsker flere funktioner med managed hosting og simpel prissætning, giver Betterlytics mere værdi.`,
      icon: 'target',
    },
  ],
};
