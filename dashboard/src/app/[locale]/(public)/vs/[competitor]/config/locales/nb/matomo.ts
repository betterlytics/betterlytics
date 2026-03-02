import { ComparisonLocaleContent } from '../..';

export const matomo: ComparisonLocaleContent = {
  name: 'Matomo Cloud',
  logo: '/tools/matomo-logo.svg',
  seo: {
    title: 'Betterlytics vs Matomo: Moderne og lettvekts alternativ',
    description:
      'Sammenlign Betterlytics med Matomo Cloud. Få moderne analyse uten kompleksitet, plugins eller serveradministrasjon. Session replay og overvåking inkludert. Fra $6/måned.',
    keywords: [
      'Matomo alternativ',
      'Matomo Cloud alternativ',
      'Piwik alternativ',
      'personvernfokusert analyse',
      'enkel webanalyse',
      'lettvekts analyse',
      'session replay',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til Matomo?',
    titleHighlight: 'alternativ',
    subtitle:
      'Få moderne og lettvekts analyse uten kompleksitet. Ingen serveradministrasjon, ingen plugin-hodepine.',
  },
  keyDifferentiators: [
    {
      title: 'Moderne arkitektur',
      betterlytics: 'Bygget fra bunnen av for dagens web. Session replay og overvåking inkludert som standard.',
      competitor: 'Startet i 2007 som Piwik. Moden plattform med mange funksjoner levert via plugins.',
    },
    {
      title: 'Ingen plugins nødvendig',
      betterlytics: 'Analyse, session replay og overvåking er inkludert. Ett verktøy, én pris.',
      competitor: 'Kjerneanalyse er gratis, men øktopptak og varmekart krever betalte tillegg.',
    },
    {
      title: 'Enkel prising',
      betterlytics: 'Gratisnivå tilgjengelig. Betalte planer fra $6/måned, alt inkludert.',
      competitor:
        'Selvhostet har kostnader til infrastruktur og vedlikehold. Cloud-planer starter høyere med betalte tillegg.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Personvern og samsvar',
        features: [
          { name: 'Cookieless sporing', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: 'Med konfigurasjon' },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: 'Med konfigurasjon' },
          { name: 'EU-hosting av data', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'Personvernfokusert som standard', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'Ingen sporing på tvers av nettsteder', betterlytics: true, competitor: true },
          { name: 'Fullt dataeierskap', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Ytelse og hastighet',
        features: [
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '~23KB' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Moderat' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: 'Begrenset' },
        ],
      },
      {
        name: 'Analysefunksjoner',
        features: [
          { name: 'Sanntidsdashbord', betterlytics: true, competitor: true },
          { name: 'Tilpassede hendelser', betterlytics: true, competitor: true },
          { name: 'Kampanjesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: 'Begrenset' },
          { name: 'Traktanalyse', betterlytics: true, competitor: 'Med tillegg' },
          { name: 'Session replay', betterlytics: true, competitor: 'Med tillegg' },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Varslingsintegrasjoner (Slack, Discord osv.)', betterlytics: true, competitor: 'Med plugins' },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Moderat' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: false },
          { name: 'Ingen kompleks konfigurasjon', betterlytics: true, competitor: false },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: 'Opptil 2 år' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: false },
          { name: 'Transparent prising', betterlytics: true, competitor: 'Begrenset' },
          { name: 'E-poststøtte', betterlytics: true, competitor: 'Betalt' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Bygget for dagens web',
      content: `Matomo startet som Piwik i 2007, da weben var et helt annet sted. Plattformen har modnet over tid, men bærer med seg eldre arkitektur. Funksjoner har blitt lagt til underveis, noen som plugins, andre innebygd.\n\nBetterlytics er designet fra bunnen av for moderne web. Lettvekt som standard, session replay inkludert, og vennlig mot Core Web Vitals. Ingen legacy-bagasje, bare ren analyse bygget for hvordan weben fungerer i dag.`,
      icon: 'sparkles',
    },
    {
      title: 'Personvern uten konfigurasjon',
      content: `Matomo kan konfigureres for cookieless sporing og GDPR-samsvar. Det er solid når det først er satt opp. Men å komme dit krever arbeid, og å opprettholde samsvar krever kontinuerlig oppfølging.\n\nBetterlytics er personvernfokusert rett ut av boksen. Cookieless som standard, GDPR-klar uten konfigurasjon, EU-hostede data. Du får personvernfordelene uten å lese konfigurasjonsdokumentasjon.`,
      icon: 'shield',
    },
    {
      title: 'Den reelle kostnaden av "gratis"',
      content: `Matomos selvhostede versjon er gratis å laste ned, men du betaler for servere, vedlikeholdstid og premium-plugins som øktopptak. Matomo Cloud starter på $19/måned og skalerer med sidevisninger.\n\nBetterlytics har et gratisnivå for små nettsteder. Betalte planer starter på $6/måned med alt inkludert: session replay, overvåking, ingen tilleggsgebyrer. Det du ser er det du betaler.`,
      icon: 'dollar',
    },
    {
      title: 'Alt på ett sted',
      content: `Matomo har omfattende analyse, men øktopptak er en betalt plugin, og oppetidsovervåking finnes ikke. Grensesnittet er kraftig, men kan oppleves overveldende.\n\nBetterlytics samler analyse, session replay, oppetidsovervåking med varsler via Slack, Discord og Teams, samt ytelsessporing i én løsning. Ett rent grensesnitt, ingen plugins å kjøpe, ingen betalingsmurer i betalte planer.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Forenkle stacken din',
    title: 'Klar for analyse uten kompleksitet?',
    subtitle: 'Ingen plugins. Ingen servervedlikehold. Bare ren analyse som fungerer.',
    buttonText: 'Start gratis prøveperiode',
  },
};
