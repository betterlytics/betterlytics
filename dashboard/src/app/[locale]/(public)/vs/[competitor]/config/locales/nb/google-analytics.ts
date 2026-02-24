import { ComparisonLocaleContent } from '../..';

export const googleAnalytics: ComparisonLocaleContent = {
  name: 'Google Analytics',
  logo: '/tools/google_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Google Analytics: Personvernfokusert alternativ',
    description:
      'Sammenlign Betterlytics med Google Analytics. Få lettvektsanalyse som er GDPR-klar, uten cookie-bannere, med raskere sidelasting og fullt dataeierskap. Gratisnivå tilgjengelig.',
    keywords: [
      'Google Analytics alternativ',
      'GA4 alternativ',
      'personvernfokusert analyse',
      'GDPR-kompatibel analyse',
      'cookieless analyse',
      'lettvekts webanalyse',
      'erstatning for Google Analytics',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til Google Analytics?',
    titleHighlight: 'alternativ',
    subtitle: 'Et lettvekts, personvernfokusert alternativ til Google Analytics. Ingen cookies, ingen bannere, ingen overflødighet.',
  },
  keyDifferentiators: [
    {
      title: 'Ingen cookie-bannere',
      betterlytics: 'Cookieless fra design. Besøkende kan surfe fritt uten avbrytelser.',
      competitor:
        'Krever vanligvis samtykkebannere, noe som kan svekke brukeropplevelsen og redusere datanøyaktigheten når brukere velger bort sporing.',
    },
    {
      title: 'Lynrask',
      betterlytics: 'Skript på <2KB lastes umiddelbart uten påvirkning på sideytelsen.',
      competitor: '~100KB+ skriptstørrelse avhengig av konfigurasjon; blokkeres ofte av annonseblokkere.',
    },
    {
      title: 'Dine data, for alltid',
      betterlytics: 'Du eier dataene dine. De deles eller selges aldri. EU-hostet med opptil 5 års lagring.',
      competitor:
        'Google kan bruke aggregerte data for å forbedre annonsering og relaterte tjenester. Begrenset til 14 måneders lagring.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Personvern og samsvar',
        features: [
          { name: 'Cookieless sporing', betterlytics: true, competitor: false },
          { name: 'GDPR-klar som standard', betterlytics: true, competitor: false },
          { name: 'Ingen cookie-banner nødvendig', betterlytics: true, competitor: false },
          { name: 'EU-hosting av data', betterlytics: true, competitor: 'Valgfritt' },
          { name: 'Personvernfokusert som standard', betterlytics: true, competitor: false },
          { name: 'Ingen sporing på tvers av nettsteder', betterlytics: true, competitor: false },
          { name: 'Fullt dataeierskap', betterlytics: true, competitor: false },
          { name: 'Open source', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Ytelse og hastighet',
        features: [
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '~100KB+' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Merkbar' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: false },
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
          { name: 'Sporing av utgående lenker', betterlytics: true, competitor: 'Krever konfigurasjon' },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Ingen datasampling', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '30+ minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Bratt' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: false },
          { name: 'Ingen kompleks konfigurasjon', betterlytics: true, competitor: false },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: '14 måneder' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: true },
          { name: 'Transparent prising', betterlytics: true, competitor: false },
          { name: 'E-poststøtte', betterlytics: true, competitor: 'Begrenset' },
          { name: 'BigQuery-eksport', betterlytics: false, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Personvern som bare fungerer',
      content: `Google Analytics bruker cookies, krever samtykkebannere under GDPR og har møtt avgjørelser fra europeiske datatilsyn. Flere europeiske datatilsyn har uttrykt bekymring for dataoverføringer til USA.\n\nBetterlytics er personvernfokusert fra dag én. Ingen cookies, ingen behov for cookie-bannere. Alle data hostes i EU. Du er GDPR-kompatibel rett ut av boksen.`,
      icon: 'shield',
    },
    {
      title: 'Sidehastighet betyr noe',
      content: `Google Analytics-skript er over 130KB og gjør ekstra forespørsler som gjør nettstedet tregere. Det kan påvirke SEO og brukeropplevelse. Blokkeres ofte av annonseblokkere og personvernverktøy, så du går uansett glipp av data.\n\nSkriptet vårt er under 2KB, over 98 % mindre. Lastes asynkront uten påvirkning på sidehastighet. Annonseblokkere blokkerer oss ikke siden vi ikke driver med annonsering, så du får mer komplette data.`,
      icon: 'zap',
    },
    {
      title: 'Dataene dine forblir dine',
      content: `Når du bruker Google Analytics, fungerer Google som databehandler og kan bruke aggregerte data for å forbedre tjenestene sine. Trafikkdataene dine mater algoritmene deres og målretting av annonser.\n\nMed Betterlytics er dataene dine dine. Vi deler, selger eller bruker dem aldri til annet enn analysen din. Vi er ikke i annonsebransjen. Du betaler for en tjeneste, vi leverer den.`,
      icon: 'lock',
    },
    {
      title: 'Enkelt fra dag én',
      content: `GA4 er komplekst. Datastrømmer, hendelser, konverteringer, forvirrende grensesnitt. Bratt læringskurve. Mange nettstedseiere forstår aldri analysen sin fullt ut.\n\nOppsett av Betterlytics tar 5 minutter. Legg til skriptet, ferdig. Dashbordet viser måltall som betyr noe i et rent grensesnitt. Ingen opplæring kreves for å forstå egen trafikk.`,
      icon: 'sparkles',
    },
    {
      title: 'Ingen skjulte kostnader',
      content: `Google Analytics er "gratis", men den skjulte kostnaden er at du gir Google dataene dine. Enterprise-funksjoner? Pris for GA360 starter vanligvis på titusenvis per år.\n\nBetterlytics er transparent. Starter på $6/måned med et gratisnivå. Session replay, overvåking, alle funksjoner inkludert. Ingen overraskende regninger, ingen kompromisser med data.`,
      icon: 'dollar',
    },
    {
      title: 'Mer enn analyse',
      content: `GA fokuserer på analyse. Du trenger separate verktøy for oppetidsovervåking, session replay og ytelsessporing. Flere verktøy, mer kompleksitet.\n\nBetterlytics inkluderer alt: analyse, session replay, oppetidsovervåking og ytelsessporing. Ett dashbord, én personvernfokusert plattform for alt du trenger.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Bytt i dag',
    title: 'Klar til å forlate Google Analytics?',
    subtitle: 'Bli med tusenvis som har byttet til personvernfokusert analyse uten å miste innsikt.',
    buttonText: 'Start gratis prøveperiode',
  },
};
