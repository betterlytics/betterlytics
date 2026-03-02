import { ComparisonLocaleContent } from '../..';

export const posthog: ComparisonLocaleContent = {
  name: 'PostHog',
  logo: '/tools/posthog-logo.svg',
  seo: {
    title: 'Betterlytics vs PostHog: Fokusert og lettvekts alternativ',
    description:
      'Sammenlign Betterlytics med PostHog. Få fokusert webanalyse med et svært lite skript, personvern som standard og forutsigbar prising. Ingen kompleksitet, bare klarhet.',
    keywords: [
      'PostHog alternativ',
      'lettvekts analyse',
      'personvernfokusert analyse',
      'enkel webanalyse',
      'cookieless analyse',
      'erstatning for PostHog',
      'analyse med forutsigbar prising',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til PostHog?',
    titleHighlight: 'alternativ',
    subtitle:
      'Betterlytics gir deg fokusert og lettvekts webanalyse med enkel prising og minimal påvirkning; for team som vil ha klarhet, ikke kompleksitet.',
  },
  keyDifferentiators: [
    {
      title: 'Virkelig lettvekts',
      betterlytics: 'Skript på <2KB. Designet for minimal påvirkning på sideytelse.',
      competitor: '~57KB skript med bredt funksjonssett og høyere lasteoverhead.',
    },
    {
      title: 'Personvern som standard',
      betterlytics: 'Cookieless fra design. Ingen cookie-bannere nødvendig.',
      competitor: 'Bruker cookies som standard. Cookieless-modus er tilgjengelig med konfigurasjon.',
    },
    {
      title: 'Enkel og forutsigbar prising',
      betterlytics: 'Gratis for alltid for små nettsteder. Betalte planer fra $6/måned med kjernefunksjoner inkludert.',
      competitor:
        'Generøst gratisnivå, men bruksbasert fakturering på tvers av flere produkter blir komplisert når du skalerer.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Personvern og samsvar',
        features: [
          { name: 'Cookieless sporing', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: 'Med konfigurasjon' },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: 'Avhenger av oppsett' },
          { name: 'EU-hosting av data', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'Personvernfokusert som standard', betterlytics: true, competitor: false },
          { name: 'Ingen sporing på tvers av nettsteder', betterlytics: true, competitor: true },
          { name: 'Fullt dataeierskap', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Ytelse og hastighet',
        features: [
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '~57KB' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Moderat' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: 'Delvis' },
        ],
      },
      {
        name: 'Analysefunksjoner',
        features: [
          { name: 'Sanntidsdashbord', betterlytics: true, competitor: true },
          { name: 'Tilpassede hendelser', betterlytics: true, competitor: true },
          { name: 'Traktanalyse', betterlytics: true, competitor: true },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: true },
          { name: 'Kampanjesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: true },
          { name: 'Core Web Vitals', betterlytics: true, competitor: true },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Feature flags', betterlytics: false, competitor: true },
          { name: 'A/B-testing', betterlytics: false, competitor: true },
          { name: 'Undersøkelser (NPS/CSAT)', betterlytics: false, competitor: true },
          { name: 'Heatmaps', betterlytics: false, competitor: true },
          { name: 'Analyse for mobilapper', betterlytics: false, competitor: true },
          { name: 'Varslingsintegrasjoner (Slack, Discord osv.)', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: 'Lengre oppstart' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Moderat' },
          { name: 'Enkelt, analysefokusert grensesnitt', betterlytics: true, competitor: false },
          { name: 'Minimalt behov for konfigurasjon', betterlytics: true, competitor: false },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: 'Opptil 7 år' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: true },
          { name: 'Forutsigbar prising', betterlytics: true, competitor: false },
          { name: 'E-poststøtte', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Fokusert vs alt-i-ett',
      content: `PostHog pakker mye inn i én plattform: produktanalyse, feature flags, A/B-testing, session replay, undersøkelser og mer. Flott for store produktteam som trenger alt. Men hvis du bare vil ha webanalyse? Da kan du ende opp med å betale for funksjoner du ikke trenger.\n\nBetterlytics gjør analyse og gjør det godt. Session replay, trakter, brukerreiser, ytelsesovervåking. Du er i gang på 5 minutter; ingen doktorgrad i produktanalyse nødvendig.`,
      icon: 'target',
    },
    {
      title: 'Sidehastighet betyr noe',
      content: `PostHogs skript er rundt 57KB gzippet. Det inkluderer støtte for feature flags, øktopptak, auto-capture og andre produktfunksjoner. På mobil eller tregere forbindelser merkes det.\n\nVårt skript? Under 2KB. Sidene dine forblir raske, Core Web Vitals holder seg grønne, og SEO forblir solid. Analyse skal ikke gjøre nettstedet tregere.`,
      icon: 'zap',
    },
    {
      title: 'Personvern rett ut av boksen',
      content: `PostHog bruker cookies som standard. Du kan konfigurere cookieless-modus, men det krever ekstra oppsett og kan begrense enkelte funksjoner. Standardmodus? I mange tilfeller betyr det at samtykkebanner er nødvendig for GDPR-samsvar.\n\nBetterlytics er cookieless fra start. Ingen konfigurasjon, ingen cookie-bannere, ingen irriterende popup-vinduer for besøkende.`,
      icon: 'shield',
    },
    {
      title: 'Vit hva du betaler for',
      content: `PostHog fakturerer separat for hendelser, øktopptak, feature flags, undersøkelser og mer. Gratisnivået er generøst, men kostnadene kan øke raskt når du skalerer. Det gjør månedlige kostnader vanskeligere å forutsi når bruken vokser.\n\nVi holder det enkelt: fast prising fra $6/måned med tydelige hendelsesgrenser. Session replay, overvåking og kjerneanalyse inkludert. Ingen regneark nødvendig for å finne ut hva du skylder.`,
      icon: 'dollar',
    },
    {
      title: 'Der PostHog vinner',
      content: `PostHog skal ha ros der det fortjenes: de er sterke på feature flags, A/B-testing og produkteksperimentering. Hvis du kjører eksperimenter og trenger granulær funksjonskontroll, er de vanskelige å slå.\n\nMen hvis du vil ha ren webanalyse med session replay, oppetidsovervåking med varsler via Slack, Discord og Teams, uten å lære en helt ny plattform, er det her vi kommer inn. Vi gjør analyse veldig godt. PostHog gjør mange ting ganske godt.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Hold det enkelt',
    title: 'Vil du ha analyse uten ekstra overhead?',
    subtitle: 'Fokusert webanalyse. Lettvekts skript. Forutsigbar prising.',
    buttonText: 'Start gratis prøveperiode',
  },
};
