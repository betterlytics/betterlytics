import { ComparisonLocaleContent } from '../..';

export const plausible: ComparisonLocaleContent = {
  name: 'Plausible',
  logo: '/tools/plausible-logo.png',
  seo: {
    title: 'Betterlytics vs Plausible: Più funzionalità, stessa privacy',
    description:
      'Confronta Betterlytics con Plausible. Approccio privacy-first, più session replay, uptime monitoring e percorsi utente in ogni piano. Gratis o da $7/mese.',
  },
  hero: {
    title: 'Cerchi un’alternativa a Plausible?',
    titleHighlight: 'alternativa',
    subtitle:
      'Stesso approccio privacy-first di Plausible, più session replay, monitoraggio dell’uptime e percorsi utente in ogni piano.',
  },
  keyDifferentiators: [
    {
      title: 'Session replay incluso',
      betterlytics: 'Osserva le sessioni reali degli utenti per capire il comportamento e risolvere i problemi.',
      competitor: 'Nessun session replay. Molto orientato alla privacy, ma con insight comportamentali limitati.',
    },
    {
      title: 'Tracciamento dei percorsi utente',
      betterlytics: 'Visualizza come gli utenti navigano nel tuo sito, pagina per pagina. Incluso in ogni piano.',
      competitor: 'Percorsi utente e funnel richiedono il piano Business, da $19/mese.',
    },
    {
      title: 'Monitoring integrato',
      betterlytics: 'Uptime monitoring e tracciamento delle performance inclusi.',
      competitor: 'Solo analytics. Il monitoring richiede strumenti separati.',
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
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: true },
          { name: 'Privacy-first di default', betterlytics: true, competitor: true },
          { name: 'Nessun cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '~3,5KB', competitor: '~2,5KB' },
          { name: 'Impatto sul caricamento della pagina', betterlytics: 'Minimo', competitor: 'Minimo' },
          { name: 'Funziona con ad blocker', betterlytics: true, competitor: 'Parziale' },
        ],
      },
      {
        name: 'Funzionalità di analytics',
        features: [
          { name: 'Dashboard in tempo reale', betterlytics: true, competitor: true },
          { name: 'Eventi personalizzati', betterlytics: true, competitor: true },
          { name: 'Proprietà globali', betterlytics: true, competitor: true },
          { name: 'Analisi dei funnel', betterlytics: true, competitor: true },
          { name: 'Tracciamento campagne (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracciamento dei link in uscita', betterlytics: true, competitor: true },
          { name: 'Tracciamento dei percorsi utente', betterlytics: true, competitor: 'Solo piano Business' },
          { name: 'Annotazioni', betterlytics: true, competitor: true },
          { name: 'Session replay', betterlytics: true, competitor: false },
          { name: 'Monitoring delle performance', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Pagine di stato pubbliche', betterlytics: true, competitor: false },
          {
            name: 'Integrazioni di notifica (Slack, Discord, ecc.)',
            betterlytics: true,
            competitor: 'Report via email/Slack',
          },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          { name: 'Tempo di configurazione', betterlytics: '<5 minuti', competitor: '<5 minuti' },
          { name: 'Curva di apprendimento', betterlytics: 'Bassa', competitor: 'Bassa' },
          { name: 'Interfaccia semplice e intuitiva', betterlytics: true, competitor: true },
          { name: 'Nessuna configurazione complessa', betterlytics: true, competitor: true },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: 'Illimitata' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: false },
          { name: 'Prezzi trasparenti', betterlytics: true, competitor: true },
          { name: 'Opzione self-hosting', betterlytics: true, competitor: true },
          { name: 'Supporto via email', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'AI e integrazioni',
        features: [
          { name: 'Server MCP', betterlytics: true, competitor: false },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Stessi valori, strumenti diversi',
      content: `Plausible e Betterlytics condividono lo stesso DNA: privacy-first, leggeri, senza cookie e pronti per il GDPR fin da subito. Entrambi sono ottime alternative a Google Analytics se la privacy è una priorità.\n\nLa differenza? Betterlytics include session replay e monitoring, oltre ai percorsi utente in ogni piano. Plausible sceglie volutamente un approccio minimal. Se hai bisogno di insight comportamentali oltre a pageview e conversioni, Betterlytics fa la differenza.`,
      icon: 'shield',
    },
    {
      title: 'Session replay rispettoso della privacy',
      content: `Plausible rinuncia completamente al session replay per massimizzare la privacy. Una scelta legittima, ma che limita la visibilità su click, punti di blocco e motivi di abbandono.\n\nBetterlytics include il session replay mantenendo un approccio senza cookie e conforme alla privacy. Nessun cross-site tracking, pieno controllo su cosa viene registrato. Gli insight comportamentali che servono, con solide garanzie di privacy.`,
      icon: 'eye',
    },
    {
      title: 'Uno strumento invece di tre',
      content: `Plausible eccelle nelle analytics di base: pageview, referrer, conversioni, funnel. Pulito e focalizzato. Ma quando servono uptime monitoring o performance tracking, servono altri strumenti.\n\nBetterlytics riunisce analytics, session replay, percorsi utente e monitoring con avvisi tramite Slack, Discord e altro in un’unica piattaforma. Un solo dashboard, una sola fattura, gli stessi standard di privacy su tutto.`,
      icon: 'layers',
    },
    {
      title: 'Confronto dei prezzi',
      content: `Plausible parte da $9/mese per 10.000 pageview. Nessun piano gratuito sulla versione hosted, anche se il self-hosting è gratuito se gestisci l’infrastruttura.\n\nBetterlytics parte da $7/mese con un piano gratuito per siti più piccoli. Session replay, monitoring e percorsi utente inclusi. Più funzionalità, prezzo di partenza più basso.`,
      icon: 'dollar',
    },
    {
      title: 'Quando Plausible è la scelta migliore',
      content: `Plausible mantiene volutamente un ambito ristretto: analisi del traffico orientata alla privacy con una UI notoriamente minimalista. Se ti servono solo visualizzazioni di pagina, referrer e obiettivi di conversione senza funzionalità aggiuntive, il prodotto focalizzato e il brand consolidato di Plausible possono risultare la scelta più rassicurante.\n\nBetterlytics aggiunge session replay, insight sulle prestazioni e monitoraggio senza rinunciare alla base privacy-first. I percorsi utente sono inclusi in ogni piano. Se sei pronto per un’analisi comportamentale più approfondita e meno fornitori da gestire, le funzionalità extra sono già incluse — senza dover integrare strumenti separati.`,
      icon: 'target',
    },
  ],
};
