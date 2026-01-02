import { ComparisonLocaleContent } from '../..';

export const matomo: ComparisonLocaleContent = {
  name: 'Matomo Cloud',
  logo: '/tools/matomo-logo.svg',
  seo: {
    title: 'Betterlytics vs Matomo: Alternativa moderna e leggera',
    description:
      'Confronta Betterlytics con Matomo Cloud. Analytics moderne senza complessità, plugin o gestione dei server. Session replay e monitoraggio inclusi. Da $6/mese.',
    keywords: [
      'alternativa Matomo',
      'alternativa Matomo Cloud',
      'alternativa Piwik',
      'analytics privacy-first',
      'analytics web semplici',
      'analytics leggere',
      'session replay',
    ],
  },
  hero: {
    title: 'Cerchi un’alternativa a Matomo?',
    titleHighlight: 'alternativa',
    subtitle:
      'Analytics moderni e leggeri senza complessità. Nessuna gestione di server, nessun problema con i plugin.',
  },
  keyDifferentiators: [
    {
      title: 'Architettura moderna',
      betterlytics: 'Progettato da zero per il web di oggi. Session replay e monitoring inclusi di default.',
      competitor: 'Nato nel 2007 come Piwik. Piattaforma matura con molte funzionalità fornite tramite plugin.',
    },
    {
      title: 'Nessun plugin necessario',
      betterlytics: 'Analytics, session replay e monitoring inclusi. Un solo strumento, un solo prezzo.',
      competitor:
        'Le analytics di base sono gratuite, ma session recording e heatmap richiedono componenti aggiuntivi a pagamento.',
    },
    {
      title: 'Prezzi semplici',
      betterlytics: 'Piano gratuito disponibile. Piani a pagamento da $6/mese con tutto incluso.',
      competitor:
        'La versione self-hosted comporta costi di infrastruttura e manutenzione. I piani cloud partono da prezzi più alti con add-on a pagamento.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy e conformità',
        features: [
          { name: 'Tracciamento senza cookie', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Pronto per il GDPR di default', betterlytics: true, competitor: 'Con configurazione' },
          { name: 'Nessun banner di cookie necessario', betterlytics: true, competitor: 'Con configurazione' },
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Privacy-first di default', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Nessun cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Piena proprietà dei dati', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Opzione self-hosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '<2KB', competitor: '~23KB' },
          { name: 'Impatto sul caricamento della pagina', betterlytics: 'Minimo', competitor: 'Moderato' },
          { name: 'Funziona con ad blocker', betterlytics: true, competitor: 'Limited' },
        ],
      },
      {
        name: 'Funzionalità di analytics',
        features: [
          { name: 'Dashboard in tempo reale', betterlytics: true, competitor: true },
          { name: 'Eventi personalizzati', betterlytics: true, competitor: true },
          { name: 'Tracciamento campagne (UTM)', betterlytics: true, competitor: true },
          { name: 'Tracciamento dei percorsi utente', betterlytics: true, competitor: 'Limited' },
          { name: 'Analisi dei funnel', betterlytics: true, competitor: 'Con add-on' },
          { name: 'Session replay', betterlytics: true, competitor: 'Con add-on' },
          { name: 'Monitoring delle performance', betterlytics: true, competitor: false },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          { name: 'Tempo di configurazione', betterlytics: '<5 minuti', competitor: '<5 minuti' },
          { name: 'Curva di apprendimento', betterlytics: 'Bassa', competitor: 'Media' },
          { name: 'Interfaccia semplice e intuitiva', betterlytics: true, competitor: false },
          { name: 'Nessuna configurazione complessa', betterlytics: true, competitor: false },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: 'Fino a 2 anni' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: false },
          { name: 'Prezzi trasparenti', betterlytics: true, competitor: 'Limited' },
          { name: 'Supporto via email', betterlytics: true, competitor: 'A pagamento' },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Progettato per il web di oggi',
      content: `Matomo nasce come Piwik nel 2007, quando il web era molto diverso. Nel tempo è maturato, ma porta con sé un’architettura legacy. Le funzionalità sono state aggiunte nel corso degli anni, a volte come plugin, a volte integrate.\n\nBetterlytics è stato progettato da zero per il web moderno. Leggero di default, session replay standard, ottimizzato per i Core Web Vitals. Nessun retaggio del passato, solo analytics pulite pensate per come funziona il web oggi.`,
      icon: 'sparkles',
    },
    {
      title: 'Privacy senza configurazioni',
      content: `Matomo può essere configurato per il tracciamento senza cookie e la conformità al GDPR. Una volta impostato è solido, ma arrivarci richiede tempo e mantenere la conformità richiede attenzione continua.\n\nBetterlytics è privacy-first fin da subito. Senza cookie di default, pronto per il GDPR senza configurazioni, dati ospitati nell’UE. Ottieni i benefici della privacy senza dover leggere documentazione tecnica.`,
      icon: 'shield',
    },
    {
      title: 'Il vero costo del “gratuito”',
      content: `La versione self-hosted di Matomo è gratuita da scaricare, ma paghi server, tempo di manutenzione e plugin premium come il session recording. Matomo Cloud parte da $19/mese e cresce in base alle pageview.\n\nBetterlytics offre un piano gratuito per siti piccoli. I piani a pagamento partono da $6/mese con tutto incluso: session replay, monitoring, nessun costo aggiuntivo. Quello che vedi è quello che paghi.`,
      icon: 'dollar',
    },
    {
      title: 'Tutto in un unico posto',
      content: `Matomo offre analytics complete, ma il session recording è un plugin a pagamento e non include uptime monitoring. L’interfaccia è potente, ma può risultare complessa.\n\nBetterlytics riunisce analytics, session replay, uptime monitoring e performance tracking in un’unica soluzione. Un’interfaccia pulita, nessun plugin da acquistare, nessun paywall sui piani a pagamento.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Semplifica il tuo stack',
    title: 'Pronto per analytics senza complessità?',
    subtitle: 'Nessun plugin. Nessuna manutenzione dei server. Solo analytics pulita che funziona.',
    buttonText: 'Inizia la prova gratuita',
  },
};
