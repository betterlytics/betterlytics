import { ComparisonLocaleContent } from '../..';

export const googleAnalytics: ComparisonLocaleContent = {
  name: 'Google Analytics',
  logo: '/tools/google_analytics-logo.svg',
  seo: {
    title: 'Betterlytics vs Google Analytics: Alternativa orientata alla privacy',
    description:
      'Confronta Betterlytics con Google Analytics. Analytics leggere e conformi al GDPR, senza banner cookie, con pagine più veloci e pieno controllo dei dati. Piano gratuito disponibile.',
    keywords: [
      'alternativa Google Analytics',
      'alternativa GA4',
      'analytics privacy-first',
      'analytics conformi GDPR',
      'analytics senza cookie',
      'analytics web leggere',
      'sostituto Google Analytics',
    ],
  },
  hero: {
    title: 'Cerchi un’alternativa a Google Analytics?',
    titleHighlight: 'alternativa',
    subtitle:
      'Un’alternativa leggera e privacy-first a Google Analytics. Niente cookie, niente banner, niente inutili complicazioni.',
  },
  keyDifferentiators: [
    {
      title: 'Nessun banner cookie',
      betterlytics: 'Cookieless by design. I visitatori navigano liberamente senza interruzioni.',
      competitor:
        'Di solito richiede banner di consenso, che peggiorano l’esperienza utente e riducono l’accuratezza dei dati quando gli utenti rifiutano.',
    },
    {
      title: 'Estremamente veloce',
      betterlytics:
        'Script sotto i 2KB che si carica istantaneamente senza impatto sulle performance della pagina.',
      competitor: 'Script da oltre 100KB a seconda della configurazione; spesso bloccato dagli ad blocker.',
    },
    {
      title: 'I tuoi dati restano tuoi',
      betterlytics:
        'Sei proprietario dei tuoi dati. Mai condivisi o venduti. Hosting in UE con conservazione fino a 5 anni.',
      competitor:
        'Google può utilizzare dati aggregati per migliorare servizi pubblicitari e correlati. Conservazione limitata a 14 mesi.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy e conformità',
        features: [
          { name: 'Tracciamento senza cookie', betterlytics: true, competitor: false },
          { name: 'Pronto per il GDPR di default', betterlytics: true, competitor: false },
          { name: 'Nessun banner cookie necessario', betterlytics: true, competitor: false },
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Privacy-first di default', betterlytics: true, competitor: false },
          { name: 'Nessun cross-site tracking', betterlytics: true, competitor: false },
          { name: 'Piena proprietà dei dati', betterlytics: true, competitor: false },
          { name: 'Open source', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '<2KB', competitor: '~100KB+' },
          { name: 'Impatto sul caricamento della pagina', betterlytics: 'Minimo', competitor: 'Visibile' },
          { name: 'Funziona con ad blocker', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Funzionalità di analytics',
        features: [
          { name: 'Dashboard in tempo reale', betterlytics: true, competitor: true },
          { name: 'Eventi personalizzati', betterlytics: true, competitor: true },
          { name: 'Analisi dei funnel', betterlytics: true, competitor: true },
          { name: 'Tracciamento dei percorsi utente', betterlytics: true, competitor: true },
          { name: 'Tracciamento campagne (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracciamento link in uscita', betterlytics: true, competitor: 'Richiede config' },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Monitoring delle performance', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Nessun campionamento dati', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          { name: 'Tempo di configurazione', betterlytics: '<5 minuti', competitor: '30+ minuti' },
          { name: 'Curva di apprendimento', betterlytics: 'Bassa', competitor: 'Ripida' },
          { name: 'Interfaccia semplice e intuitiva', betterlytics: true, competitor: false },
          { name: 'Nessuna configurazione complessa', betterlytics: true, competitor: false },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: '14 mesi' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: true },
          { name: 'Prezzi trasparenti', betterlytics: true, competitor: false },
          { name: 'Supporto via email', betterlytics: true, competitor: 'Limited' },
          { name: 'Export BigQuery', betterlytics: false, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Privacy che funziona davvero',
      content: `Google Analytics utilizza cookie, richiede banner di consenso in base al GDPR ed è stato oggetto di decisioni da parte delle autorità europee per la protezione dei dati. Diversi garanti UE hanno sollevato preoccupazioni sui trasferimenti di dati verso gli Stati Uniti.\n\nBetterlytics è privacy-first fin dal primo giorno. Nessun cookie e nessun banner di consenso. Tutti i dati sono ospitati nell’UE. Sei conforme al GDPR fin da subito.`,
      icon: 'shield',
    },
    {
      title: 'La velocità conta',
      content: `Gli script di Google Analytics hanno una dimensione superiore ai 130KB e generano richieste aggiuntive che possono rallentare il tuo sito. Questo influisce su SEO ed esperienza utente. Inoltre, vengono spesso bloccati da ad blocker e strumenti per la privacy, quindi perdi dati comunque.\n\nIl nostro script è sotto i 2KB, oltre il 98% più leggero. Si carica in modo asincrono senza alcun impatto sulla velocità della pagina. Gli ad blocker non ci bloccano perché non facciamo pubblicità, così ottieni dati più completi.`,
      icon: 'zap',
    },
    {
      title: 'I tuoi dati restano tuoi',
      content: `Quando utilizzi Google Analytics, Google agisce come responsabile del trattamento e può usare dati aggregati per migliorare i propri servizi. I dati di traffico contribuiscono ai loro algoritmi e alla pubblicità.\n\nCon Betterlytics i dati sono tuoi. Non li condividiamo, non li vendiamo e non li usiamo per altro. Non siamo nel business della pubblicità. Tu paghi un servizio, noi lo forniamo.`,
      icon: 'lock',
    },
    {
      title: 'Semplice fin dal primo giorno',
      content: `GA4 è complesso. Stream di dati, eventi, conversioni e un’interfaccia poco intuitiva. La curva di apprendimento è ripida e molti proprietari di siti non comprendono mai davvero le proprie analytics.\n\nCon Betterlytics bastano 5 minuti. Aggiungi lo script e hai finito. La dashboard mostra le metriche che contano, in un’interfaccia pulita e chiara. Nessuna formazione necessaria per capire il tuo traffico.`,
      icon: 'sparkles',
    },
    {
      title: 'Nessun costo nascosto',
      content: `Google Analytics è “gratuito”, ma il costo nascosto è cedere i tuoi dati a Google. Le funzionalità enterprise? I prezzi di GA360 partono spesso da decine di migliaia di dollari all’anno.\n\nBetterlytics è trasparente. Parte da $6/mese con un piano gratuito. Session replay, monitoring e tutte le funzionalità incluse. Nessuna sorpresa, nessun compromesso sui dati.`,
      icon: 'dollar',
    },
    {
      title: 'Oltre le analytics',
      content: `GA si concentra solo sulle analytics. Per uptime monitoring, session replay e performance tracking servono strumenti separati. Più tool, più complessità.\n\nBetterlytics include tutto: analytics, session replay, uptime monitoring e performance tracking. Un’unica dashboard, un’unica piattaforma privacy-first per tutto ciò che ti serve.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Passa ora',
    title: 'Pronto a lasciare Google Analytics?',
    subtitle:
      'Unisciti a migliaia di utenti che sono passati alle analytics privacy-first senza rinunciare agli insight.',
    buttonText: 'Inizia la prova gratuita',
  },
};
