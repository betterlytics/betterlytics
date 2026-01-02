import { ComparisonLocaleContent } from '../..';

export const fathom: ComparisonLocaleContent = {
  name: 'Fathom Analytics',
  logo: '/tools/fathom_analytics-logo.svg',
  hero: {
    title: 'Cerchi un’alternativa a Fathom Analytics?',
    titleHighlight: 'alternativa',
    subtitle:
      'Le stesse analytics privacy-first, con in più session replay, funnel e tracciamento dei percorsi utente. Più insight a un prezzo inferiore.',
  },
  keyDifferentiators: [
    {
      title: 'Session replay incluso',
      betterlytics: 'Osserva le sessioni reali degli utenti per capire il comportamento e individuare i problemi.',
      competitor: 'Nessun session replay. Limitato ad analytics aggregate.',
    },
    {
      title: 'Analisi di funnel e percorsi utente',
      betterlytics: 'Funnel multi-step e tracciamento dei user journey per comprendere i percorsi di conversione.',
      competitor: 'Nessuna analisi di funnel o dei percorsi. Solo tracciamento eventi di base.',
    },
    {
      title: 'Prezzo di partenza più basso',
      betterlytics: 'Da $6/mese con un piano gratuito per siti più piccoli.',
      competitor: 'Da $15/mese. Nessun piano gratuito.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy e conformità',
        features: [
          { name: 'Tracciamento senza cookie', betterlytics: true, competitor: true },
          { name: 'Pronto per il GDPR di default', betterlytics: true, competitor: true },
          { name: 'Nessun banner cookie necessario', betterlytics: true, competitor: true },
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Privacy-first di default', betterlytics: true, competitor: true },
          { name: 'Nessun cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: false },
          { name: 'Opzione self-hosting', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '<2KB', competitor: '<2KB' },
          { name: 'Impatto sul caricamento della pagina', betterlytics: 'Minimo', competitor: 'Minimo' },
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
          { name: 'Analisi dei funnel', betterlytics: true, competitor: false },
          { name: 'Tracciamento dei percorsi utente', betterlytics: true, competitor: false },
          { name: 'Annotazioni', betterlytics: true, competitor: false },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Monitoring delle performance', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Importazione dati da GA', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          { name: 'Tempo di configurazione', betterlytics: '<5 minuti', competitor: '<5 minuti' },
          { name: 'Curva di apprendimento', betterlytics: 'Bassa', competitor: 'Bassa' },
          { name: 'Interfaccia semplice e intuitiva', betterlytics: true, competitor: true },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: 'Illimitata' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: false },
          { name: 'Prezzo di partenza', betterlytics: 'Da $6/mese', competitor: 'Da $15/mese' },
          { name: 'Prezzi trasparenti', betterlytics: true, competitor: true },
          { name: 'Supporto via email', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Stessa filosofia sulla privacy',
      content: `Fathom e Betterlytics condividono lo stesso DNA: privacy-first, leggeri e senza bisogno di banner cookie. Entrambi sono cookieless e progettati per essere pronti al GDPR fin da subito. Vuoi allontanarti da Google Analytics? Entrambi sono ottime alternative.\n\nLa differenza sta nella profondità. Betterlytics include session replay, analisi dei funnel e tracciamento dei percorsi utente. Non solo cosa è successo, ma anche come e perché gli utenti si comportano in un certo modo.`,
      icon: 'shield',
    },
    {
      title: 'Oltre i numeri aggregati',
      content: `Fathom mostra pageview, referrer ed eventi di base. Pulito e semplice. Ma quando vuoi capire perché gli utenti abbandonano o come usano davvero il tuo sito, resti limitato ai numeri.\n\nBetterlytics include il session replay per osservare le sessioni reali, funnel per seguire i percorsi di conversione e visualizzazioni dei journey per capire come navigano i visitatori. Problemi e opportunità che i numeri da soli non rivelano.`,
      icon: 'eye',
    },
    {
      title: 'Prezzo vs valore',
      content: `Fathom parte da $15/mese per 100.000 pageview. Nessun piano gratuito e pagamento richiesto fin dall’inizio.\n\nBetterlytics parte da $6/mese, quasi il 60% in meno, con un piano gratuito per siti più piccoli. Ottieni più funzionalità (session replay, funnel, percorsi utente) a un prezzo inferiore. Entrambi offrono prezzi trasparenti.`,
      icon: 'dollar',
    },
    {
      title: 'Dove Fathom eccelle',
      content: `Fathom offre conservazione dei dati illimitata (noi fino a 5 anni), un importer GA4 per migrare i dati storici e domini personalizzati per ridurre l’impatto degli ad blocker. È una piattaforma solida con una lunga esperienza.\n\nMa se cerchi session replay, funnel, percorsi utente e più insight a un prezzo inferiore, con un piano gratuito per iniziare, Betterlytics offre più valore.`,
      icon: 'target',
    },
  ],
};
