import { ComparisonLocaleContent } from '../..';

export const fathom: ComparisonLocaleContent = {
  name: 'Fathom Analytics',
  logo: '/tools/fathom_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Fathom Analytics: Flere funksjoner, lavere pris',
    description:
      'Sammenlign Betterlytics med Fathom Analytics. Samme personvernfokuserte tilnærming med session replay, trakter og sporing av brukerreiser. Gratisnivå tilgjengelig, fra $6/måned.',
    keywords: [
      'Fathom Analytics alternativ',
      'Fathom alternativ',
      'personvernfokusert analyse',
      'session replay',
      'traktanalyse',
      'rimelig analyse',
      'GDPR-kompatibel analyse',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til Fathom Analytics?',
    titleHighlight: 'alternativ',
    subtitle:
      'Få samme personvernfokuserte analyse, pluss session replay, trakter og sporing av brukerreiser. Mer innsikt til en lavere pris.',
  },
  keyDifferentiators: [
    {
      title: 'Session Replay inkludert',
      betterlytics: 'Se ekte brukerøkter for å forstå atferd og identifisere problemer.',
      competitor: 'Ingen session replay. Begrenset til aggregert analyse.',
    },
    {
      title: 'Trakt- og brukerreiseanalyse',
      betterlytics: 'Flertrinnstrakter og sporing av brukerreiser for å forstå konverteringsløp.',
      competitor: 'Ingen trakt- eller brukerreiseanalyse. Kun grunnleggende hendelsessporing',
    },
    {
      title: 'Lavere startpris',
      betterlytics: 'Starter på $6/måned med et gratisnivå for mindre nettsteder.',
      competitor: 'Starter på $15/måned. Ingen gratisnivå.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Personvern og samsvar',
        features: [
          { name: 'Cookieless sporing', betterlytics: true, competitor: true },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: true },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: true },
          { name: 'EU-hosting av data', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'Personvernfokusert som standard', betterlytics: true, competitor: true },
          { name: 'Ingen sporing på tvers av nettsteder', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: false },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ytelse og hastighet',
        features: [
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analysefunksjoner',
        features: [
          { name: 'Sanntidsdashbord', betterlytics: true, competitor: true },
          { name: 'Tilpassede hendelser', betterlytics: true, competitor: true },
          { name: 'Kampanjesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing av utgående lenker', betterlytics: true, competitor: true },
          { name: 'Traktanalyse', betterlytics: true, competitor: false },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: false },
          { name: 'Annotasjoner', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Varslingsintegrasjoner (Slack, Discord osv.)', betterlytics: true, competitor: false },
          { name: 'Import av GA-data', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Mild' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: 'For alltid' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: false },
          { name: 'Startpris', betterlytics: 'Fra $6/måned', competitor: 'Fra $15/måned' },
          { name: 'Transparent prising', betterlytics: true, competitor: true },
          { name: 'E-poststøtte', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Samme personvernfilosofi',
      content: `Fathom og Betterlytics deler samme DNA: personvern først, lettvektsløsning og ingen behov for cookie-banner. Begge er cookieless og designet for å være GDPR-klare som standard. Vil du bort fra Google Analytics? Begge fungerer.\n\nForskjellen er dybde. Vi inkluderer session replay, traktanalyse og sporing av brukerreiser. Ikke bare hva som skjedde, men hvordan og hvorfor brukere oppfører seg som de gjør.`,
      icon: 'shield',
    },
    {
      title: 'Mer enn aggregerte tall',
      content: `Fathom viser sidevisninger, henvisere og grunnleggende hendelser. Rent og enkelt. Men når du trenger å vite hvorfor brukere faller fra, eller hvordan de faktisk bruker nettstedet ditt, blir du sittende igjen med bare tall.\n\nBetterlytics inkluderer session replay for å se ekte brukerøkter, trakter for å spore konverteringsløp, visualisering av reiser og overvåking med varsler via Slack, Discord og mer. Problemer og muligheter som tall alene ikke avslører.`,
      icon: 'eye',
    },
    {
      title: 'Pris vs verdi',
      content: `Fathom starter på $15/måned for 100 000 sidevisninger. Ingen gratisnivå, og betaling kreves for å komme i gang.\n\nBetterlytics starter på $6/måned, nesten 60 % mindre, med et gratisnivå for mindre nettsteder. Du får flere funksjoner (session replay, trakter, brukerreiser) til lavere pris. Begge har transparent prising.`,
      icon: 'dollar',
    },
    {
      title: 'Der Fathom vinner',
      content: `Fathom har datalagring for alltid (vi lagrer opptil 5 år), en GA4-importør for migrering av historiske data og egendefinerte domener for å redusere påvirkning fra annonseblokkere. De har vært lenger i markedet med en dokumentert merittliste.\n\nMen hvis du ønsker session replay, trakter, brukerreiser og mer, til en lavere pris med gratisnivå for oppstart, gir vi bedre verdi.`,
      icon: 'target',
    },
  ],
};
