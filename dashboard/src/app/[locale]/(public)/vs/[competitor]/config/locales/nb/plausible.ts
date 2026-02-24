import { ComparisonLocaleContent } from '../..';

export const plausible: ComparisonLocaleContent = {
  name: 'Plausible',
  logo: '/tools/plausible-logo.png',
  seo: {
    title: 'Betterlytics vs Plausible: Flere funksjoner, samme personvern',
    description:
      'Sammenlign Betterlytics med Plausible. Samme personvernfokuserte tilnærming, pluss session replay, brukerreiser og overvåking. Gratisnivå tilgjengelig, fra $6/måned.',
    keywords: [
      'Plausible alternativ',
      'Plausible Analytics alternativ',
      'personvernfokusert analyse',
      'session replay',
      'sporing av brukerreiser',
      'lettvekts analyse',
      'GDPR-kompatibel analyse',
    ],
  },
  hero: {
    title: 'Ser du etter et alternativ til Plausible?',
    titleHighlight: 'alternativ',
    subtitle:
      'Alt Plausible tilbyr, pluss session replay, brukerreiser, overvåking og mer. Samme personvernfokuserte tilnærming, dypere innsikt.',
  },
  keyDifferentiators: [
    {
      title: 'Session Replay inkludert',
      betterlytics: 'Se ekte brukerøkter for å forstå atferd og rette problemer.',
      competitor: 'Ingen session replay. Personvernfokusert, men begrenser innsikt i brukeradferd.',
    },
    {
      title: 'Sporing av brukerreiser',
      betterlytics: 'Visualiser hvordan brukere navigerer gjennom nettstedet ditt side for side.',
      competitor: 'Kun traktanalyse. Ingen visualisering av individuelle brukerreiser.',
    },
    {
      title: 'Innebygd overvåking',
      betterlytics: 'Oppetidsovervåking og ytelsessporing inkludert.',
      competitor: 'Kun analyse. Overvåking krever separate verktøy.',
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
          { name: 'Skriptstørrelse', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Påvirkning på sidelasting', betterlytics: 'Minimal', competitor: 'Minimal' },
          { name: 'Fungerer med annonseblokkere', betterlytics: true, competitor: 'Delvis' },
        ],
      },
      {
        name: 'Analysefunksjoner',
        features: [
          { name: 'Sanntidsdashbord', betterlytics: true, competitor: true },
          { name: 'Tilpassede hendelser', betterlytics: true, competitor: true },
          { name: 'Traktanalyse', betterlytics: true, competitor: true },
          { name: 'Kampanjesporing (UTM)', betterlytics: true, competitor: true },
          { name: 'Sporing av utgående lenker', betterlytics: true, competitor: true },
          { name: 'Sporing av brukerreiser', betterlytics: true, competitor: false },
          { name: 'Annotasjoner', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Ytelsesovervåking', betterlytics: true, competitor: false },
          { name: 'Oppetidsovervåking', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Brukervennlighet',
        features: [
          { name: 'Oppsettstid', betterlytics: '<5 minutter', competitor: '<5 minutter' },
          { name: 'Læringskurve', betterlytics: 'Mild', competitor: 'Mild' },
          { name: 'Enkelt og intuitivt grensesnitt', betterlytics: true, competitor: true },
          { name: 'Ingen kompleks konfigurasjon', betterlytics: true, competitor: true },
          { name: 'Datalagring', betterlytics: 'Opptil 5 år', competitor: 'Ubegrenset' },
        ],
      },
      {
        name: 'Prising og støtte',
        features: [
          { name: 'Gratisnivå tilgjengelig', betterlytics: true, competitor: false },
          { name: 'Transparent prising', betterlytics: true, competitor: true },
          { name: 'Mulighet for selvhosting', betterlytics: true, competitor: true },
          { name: 'E-poststøtte', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Samme verdier, ulike verktøysett',
      content: `Plausible og Betterlytics deler samme DNA: personvern først, lettvektsløsning, ingen cookies, GDPR-klar rett ut av boksen. Begge er gode alternativer til Google Analytics hvis personvern er viktig for deg.\n\nForskjellen? Betterlytics inkluderer session replay, sporing av brukerreiser og overvåking. Plausible holder det bevisst minimalt. Hvis du trenger atferdsinnsikt utover sidevisninger og konverteringer, har vi det du trenger.`,
      icon: 'shield',
    },
    {
      title: 'Personverntrygg Session Replay',
      content: `Plausible hopper helt over session replay for å holde seg maksimalt personvernvennlig. Et fair valg. Men det betyr at du ikke kan se hvor brukere klikker, hvor de setter seg fast eller hvorfor de forlater siden.\n\nVi inkluderer session replay samtidig som vi er cookieless og personvernkompatible. Ingen sporing på tvers av nettsteder, og du kontrollerer hva som blir registrert. Atferdsinnsikten du trenger, med sterke personverngarantier.`,
      icon: 'eye',
    },
    {
      title: 'Ett verktøy i stedet for tre',
      content: `Plausible gjør kjerneanalyse veldig bra: sidevisninger, henvisere, konverteringer, trakter. Rent og fokusert. Men når du trenger oppetidsovervåking eller ytelsessporing, må du legge til flere verktøy.\n\nBetterlytics samler analyse, session replay, brukerreiser og overvåking på ett sted. Ett dashbord, én faktura, samme personvernstandard overalt.`,
      icon: 'layers',
    },
    {
      title: 'Prisoversikt',
      content: `Plausible starter på $9/måned for 10 000 sidevisninger. Ingen gratisnivå i hostet versjon, selv om selvhosting er gratis hvis du håndterer infrastrukturen selv.\n\nBetterlytics starter på $6/måned med et gratisnivå for mindre nettsteder. Du får session replay, overvåking og brukerreiser inkludert. Flere funksjoner, lavere startpris.`,
      icon: 'dollar',
    },
    {
      title: 'Når Plausible passer bedre',
      content: `Plausible holder bevisst omfanget smalt: personvernfokusert trafikkanalyse med et kjent minimalistisk grensesnitt. Hvis du bare trenger sidevisninger, henvisere og konverteringsmål uten ekstra kompleksitet, kan Plausibles fokuserte produkt og etablerte merkevare være det tryggeste valget.\n\nBetterlytics legger til session replay, brukerreiser, ytelsesinnsikt og overvåking uten å gå på kompromiss med personverngrunnlaget. Hvis du er klar for dypere innsikt i atferd og færre leverandører, er den ekstra kapasiteten allerede innebygd; ingen ekstra verktøy å sy sammen.`,
      icon: 'target',
    },
  ],
};
