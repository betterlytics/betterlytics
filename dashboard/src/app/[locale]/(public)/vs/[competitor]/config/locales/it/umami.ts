import { ComparisonLocaleContent } from '../..';

export const umami: ComparisonLocaleContent = {
  name: 'Umami',
  logo: '/tools/umami-logo.svg',
  seo: {
    title: 'Betterlytics vs Umami: Session replay e monitoraggio inclusi',
    description:
      'Confronta Betterlytics con Umami. Le stesse analytics leggere e orientate alla privacy, con session replay, percorsi utente e monitoraggio dell’uptime inclusi. Piano gratuito disponibile.',
    keywords: [
      'alternativa Umami',
      'alternativa Umami Analytics',
      'analytics privacy-first',
      'session replay',
      'monitoraggio uptime',
      'analytics leggere',
      'analytics open source',
    ],
  },
  hero: {
    title: 'Cerchi un’alternativa a Umami?',
    titleHighlight: 'alternativa',
    subtitle:
      'Ti piace la semplicità di Umami? Ottieni la stessa analytics leggera e privacy-first, con session replay, percorsi utente e monitoraggio dell’uptime integrati.',
  },
  keyDifferentiators: [
    {
      title: 'Analisi del comportamento integrata',
      betterlytics:
        'Session replay e tracciamento dei percorsi utente ti mostrano esattamente come i visitatori interagiscono con il tuo sito.',
      competitor:
        'Si concentra su metriche aggregate. Nessun modo per vedere il comportamento dei singoli utenti o i loro percorsi di navigazione.',
    },
    {
      title: 'Monitoraggio di uptime e performance',
      betterlytics: 'Monitora Core Web Vitals e la disponibilità del sito dallo stesso dashboard delle analytics.',
      competitor: 'Solo analytics. Il monitoraggio di uptime e performance richiede strumenti separati.',
    },
    {
      title: 'Setup self-hosting più semplice',
      betterlytics: 'Distribuzione basata su Docker con configurazione minima. Operativo in pochi minuti.',
      competitor: 'Richiede PostgreSQL o MySQL e diversi passaggi di configurazione manuale.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy e conformità',
        features: [
          { name: 'Tracciamento senza cookie', betterlytics: true, competitor: true },
          { name: 'GDPR-ready di default', betterlytics: true, competitor: true },
          { name: 'Nessun banner cookie necessario', betterlytics: true, competitor: true },
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: true },
          { name: 'Privacy-first di default', betterlytics: true, competitor: true },
          { name: 'Nessun tracciamento cross-site', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '<2KB', competitor: '~2–3KB' },
          { name: 'Impatto sul caricamento', betterlytics: 'Minimo', competitor: 'Minimo' },
          { name: 'Funziona con ad blocker', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Funzionalità di analytics',
        features: [
          { name: 'Dashboard in tempo reale', betterlytics: true, competitor: true },
          { name: 'Eventi personalizzati', betterlytics: true, competitor: true },
          { name: 'Tracciamento campagne (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracciamento link in uscita', betterlytics: true, competitor: true },
          { name: 'Analisi funnel', betterlytics: true, competitor: true },
          { name: 'Tracciamento dei percorsi utente', betterlytics: true, competitor: true },
          { name: 'Retention utenti', betterlytics: false, competitor: true },
          { name: 'Annotazioni', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Monitoraggio performance', betterlytics: true, competitor: false },
          { name: 'Monitoraggio uptime', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          { name: 'Tempo di configurazione', betterlytics: '<5 minuti', competitor: '<5 minuti' },
          { name: 'Curva di apprendimento', betterlytics: 'Ridotta', competitor: 'Ridotta' },
          { name: 'Interfaccia semplice e intuitiva', betterlytics: true, competitor: true },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: 'Configurabile' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: true },
          { name: 'Prezzi trasparenti', betterlytics: true, competitor: true },
          { name: 'Opzione self-hosting', betterlytics: true, competitor: true },
          { name: 'Supporto via email', betterlytics: true, competitor: 'Solo sui piani a pagamento' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Entrambi progettati per la privacy',
      content: `Umami e Betterlytics condividono lo stesso DNA: tracciamento senza cookie, conformità GDPR e nessun bisogno di banner per il consenso. Entrambi gli strumenti sono progettati per rispettare la privacy degli utenti fin dalle fondamenta.\n\nNessuno dei due richiede banner di consenso secondo il GDPR. Nessuno vende o condivide i tuoi dati. Se stai lasciando Google Analytics per motivi di privacy, entrambe sono ottime alternative. La scelta dipende dalle funzionalità di cui hai bisogno.`,
      icon: 'shield',
    },
    {
      title: 'Capire il “perché” dietro i numeri',
      content: `Umami mostra cosa è successo: visualizzazioni di pagina, referrer, eventi e conversioni. Pulito e diretto.\n\nBetterlytics aggiunge il session replay. Puoi vedere come gli utenti interagiscono con il tuo sito, dove cliccano, quanto scorrono e dove incontrano frizioni. Ideale quando vuoi capire il comportamento, non solo contare le visite.`,
      icon: 'eye',
    },
    {
      title: 'Anticipa i problemi di downtime',
      content: `Umami è focalizzato esclusivamente sulle analytics. Per il monitoraggio di uptime o performance è necessario utilizzare strumenti separati.\n\nBetterlytics include il monitoraggio dell’uptime e dei Core Web Vitals. Ricevi avvisi quando il sito è lento o non disponibile e puoi analizzare le performance insieme ai dati di traffico nello stesso dashboard.`,
      icon: 'gauge',
    },
    {
      title: 'Hosted o self-hosted',
      content: `Entrambi gli strumenti supportano il self-hosting. Umami utilizza PostgreSQL o MySQL. Betterlytics utilizza Docker con ClickHouse.\n\nPer l’hosting gestito, Betterlytics parte da $6/mese con un piano gratuito. Umami Cloud parte da $20/mese. Entrambi offrono accesso completo alle funzionalità senza componenti aggiuntivi premium.`,
      icon: 'server',
    },
    {
      title: 'Dove Umami eccelle',
      content: `Umami è eccellente per un’analytics semplice e pulita. Offre report di retention utenti, dashboard pubbliche condivisibili e una solida community open source.\n\nBetterlytics è ideale se desideri anche session replay, monitoraggio dell’uptime o tracking delle performance insieme alle analytics. Stessa attenzione alla privacy, con qualche strumento in più incluso.`,
      icon: 'target',
    },
  ],
};
