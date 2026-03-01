import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session Replay og overvåking inkludert',
    description:
      'Sammenlign Betterlytics med Umami. Samme lettvekts, personvernfokuserte analyse med innebygd session replay, brukerreiser og oppetidsovervåking. Gratisnivå tilgjengelig.',
    keywords: [
      'Umami alternativ',
      'Umami Analytics alternativ',
      'personvernfokusert analyse',
      'session replay',
      'oppetidsovervåking',
      'lettvekts analyse',
      'open source analyse',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til Umami?',
    titleHighlight: 'alternativ',
    subtitle:
      'Liker du enkelheten i Umami? Få den samme lettvekts, personvernfokuserte analysen med innebygd session replay, brukerreiser og oppetidsovervåking.',
  },
  keyDifferentiators: [
    {
      title: 'Innebygd atferdsanalyse',
      betterlytics:
        'Session replay og sporing av brukerreiser viser deg nøyaktig hvordan besøkende samhandler med nettstedet ditt.',
      competitor: 'Fokuserer på aggregerte måltall. Ingen måte å se individuell brukeradferd eller navigasjonsstier på.',
    },
    {
      title: 'Oppetids- og ytelsesovervåking',
      betterlytics: 'Spor Core Web Vitals og tilgjengelighet for nettstedet fra samme dashbord som analysen din.',
      competitor: 'Kun analyse. Oppetids- og ytelsesovervåking krever separate verktøy.',
    },
    {
      title: 'Enklere oppsett for selvhosting',
      betterlytics: 'Docker-basert utrulling med minimal konfigurasjon. Oppe og går på minutter.',
      competitor: 'Krever PostgreSQL eller MySQL og flere manuelle oppsettsteg.',
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
          { name: 'EU-hosting av data', betterlytics: true, competitor: true },
          { name: 'Personvernfokusert som standard', betterlytics: true, competitor: true },
          { name: 'Ingen sporing på tvers av nettsteder', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Ytelse og hastighet',
        features: [
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '~2–3KB' },
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
          { name: 'Traktanalyse', betterlytics: true, competitor: true },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: true },
          { name: 'Brukerretensjon', betterlytics: false, competitor: true },
          { name: 'Annotasjoner', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Varslingsintegrasjoner (Slack, Discord osv.)', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Mild' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: 'Konfigurerbar' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: true },
          { name: 'Transparent prising', betterlytics: true, competitor: true },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: true },
          { name: 'E-poststøtte', betterlytics: true, competitor: 'Betalt på lavere planer' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Begge bygget for personvern',
      content: `Umami og Betterlytics deler samme DNA: cookieless, GDPR-klare og uten behov for cookie-bannere. Begge verktøyene er bygget for å respektere brukernes personvern fra grunnen av.\n\nIngen av dem krever samtykkebannere under GDPR. Ingen av dem selger eller deler dataene dine. Hvis du forlater Google Analytics av personvernhensyn, er begge solide valg. Spørsmålet er hvilket funksjonssett som passer behovene dine best.`,
      icon: 'shield',
    },
    {
      title: 'Forstå "hvorfor" bak måltallene',
      content: `Umami viser deg hva som skjedde: sidevisninger, henvisere, hendelser og konverteringer. Rent og rett frem.\n\nBetterlytics legger til session replay oppå dette. Du kan se hvordan brukere samhandler med nettstedet ditt, hvor de klikker eller skroller, og oppdage friksjonspunkter. Nyttig når du vil forstå atferd, ikke bare telle besøk.`,
      icon: 'eye',
    },
    {
      title: 'Ligg i forkant av nedetid',
      content: `Umami fokuserer på analyse. For oppetids- eller ytelsesovervåking må du bruke et separat verktøy.\n\nBetterlytics inkluderer oppetidsovervåking og sporing av Core Web Vitals. Du får varsler via Slack, Discord, Teams eller webhooks når nettstedet er tregt eller nede, og kan se ytelsesdata sammen med trafikkstatistikk i samme dashbord.`,
      icon: 'gauge',
    },
    {
      title: 'Hostet eller selvhostet',
      content: `Begge verktøyene støtter selvhosting. Umami fungerer med PostgreSQL eller MySQL. Betterlytics bruker Docker med ClickHouse.\n\nFor administrert hosting starter Betterlytics på $6/måned med gratisnivå. Umami Cloud starter på $20/måned. Begge gir full tilgang til funksjoner uten premium-tillegg.`,
      icon: 'server',
    },
    {
      title: 'Der Umami skinner',
      content: `Umami gjør enkel analyse godt. Det har rapporter for brukerretensjon, offentlige delbare dashbord og et sterkt open source-miljø.\n\nBetterlytics passer godt hvis du også vil ha session replay, oppetidsovervåking eller ytelsessporing sammen med analysen. Samme personvernfokus, med noen flere verktøy inkludert.`,
      icon: 'target',
    },
  ],
};
