import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session Replay og overvåking inkludert',
    description:
      'Sammenlign Betterlytics med Umami. Personvernfokusert analyse, pluss oppetidsovervåking, statussider og session replay på alle planer. Gratisnivå tilgjengelig.',
  },
  hero: {
    title: 'Ser du etter et alternativ til Umami?',
    titleHighlight: 'alternativ',
    subtitle:
      'Liker du enkelheten i Umami? Få den samme lettvekts, personvernfokuserte analysen, pluss oppetidsovervåking, statussider og session replay på alle planer.',
  },
  keyDifferentiators: [
    {
      title: 'Innebygd atferdsanalyse',
      betterlytics:
        'Session replay og sporing av brukerreiser viser deg nøyaktig hvordan besøkende samhandler med nettstedet ditt. Begge er med på alle planer, også gratisnivået.',
      competitor:
        'Rapporter for brukerreiser på alle planer. På Umami Cloud starter session replays på Business-planen til $200/måned.',
    },
    {
      title: 'Innebygd oppetidsovervåking',
      betterlytics: 'Spor Core Web Vitals og tilgjengelighet for nettstedet fra samme dashbord som analysen din.',
      competitor: 'Måler Core Web Vitals, men har ingen oppetidsovervåking. Det krever et separat verktøy.',
    },
    {
      title: 'Enklere oppsett for selvhosting',
      betterlytics: 'Docker-basert utrulling med minimal konfigurasjon. Oppe og går på minutter.',
      competitor: 'Krever PostgreSQL og flere manuelle oppsettsteg.',
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
          { name: 'Skriptstørrelse', betterlytics: '~3,5KB', competitor: '~4KB' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Analysefunksjoner',
        features: [
          { name: 'Sanntidsdashbord', betterlytics: true, competitor: true },
          { name: 'Tilpassede hendelser', betterlytics: true, competitor: true },
          { name: 'Globale egenskaper', betterlytics: true, competitor: 'Via øktegenskaper' },
          { name: 'Kampanjesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing av utgående lenker', betterlytics: true, competitor: true },
          { name: 'Traktanalyse', betterlytics: true, competitor: true },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: true },
          { name: 'Brukerretensjon', betterlytics: false, competitor: true },
          { name: 'Annotasjoner', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: 'Fra $200/måned' },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: true },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
          { name: 'Offentlige statussider', betterlytics: true, competitor: false },
          { name: 'Varslingsintegrasjoner (Slack, Discord osv.)', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Mild' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: '6 måneder til 5 år' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: true },
          { name: 'Transparent prising', betterlytics: true, competitor: true },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: true },
          { name: 'E-poststøtte', betterlytics: true, competitor: 'Kun på betalte planer' },
        ],
      },
      {
        name: 'AI og integrasjoner',
        features: [
          { name: 'MCP-server', betterlytics: true, competitor: true },
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
      content: `Umami viser deg hva som skjedde: sidevisninger, henvisere, hendelser, konverteringer og brukerreiser. Det har også session replays, men på Umami Cloud starter de på Business-planen til $200/måned.\n\nBetterlytics inkluderer session replay på alle planer, også gratisnivået. Du kan se hvordan brukere samhandler med nettstedet ditt, hvor de klikker eller skroller, og oppdage friksjonspunkter. Nyttig når du vil forstå atferd, ikke bare telle besøk.`,
      icon: 'eye',
    },
    {
      title: 'Ligg i forkant av nedetid',
      content: `Umami måler Core Web Vitals, men har ingen oppetidsovervåking. For oppetidssjekker og varsler må du bruke et separat verktøy.\n\nBetterlytics inkluderer oppetidsovervåking og sporing av Core Web Vitals. Du får varsler via Slack, Discord, Teams eller webhooks når nettstedet er tregt eller nede, og kan se ytelsesdata sammen med trafikkstatistikk i samme dashbord.`,
      icon: 'gauge',
    },
    {
      title: 'Hostet eller selvhostet',
      content: `Begge verktøyene støtter selvhosting. Umami kjører på PostgreSQL. Betterlytics bruker Docker med ClickHouse.\n\nFor administrert hosting har begge et gratisnivå. Betalte planer starter på $9/måned hos Betterlytics og $20/måned hos Umami Cloud. Umami forbeholder session replays Business-planen til $200/måned.`,
      icon: 'server',
    },
    {
      title: 'Der Umami skinner',
      content: `Umami gjør enkel analyse godt. Det har rapporter for brukerretensjon, offentlige delbare dashbord og et sterkt open source-miljø.\n\nBetterlytics passer godt hvis du også vil ha oppetidsovervåking, statussider og session replay på alle planer sammen med analysen. Samme personvernfokus, med noen flere verktøy inkludert.`,
      icon: 'target',
    },
  ],
};
