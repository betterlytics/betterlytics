import { ComparisonLocaleContent } from '../..';

export const posthog: ComparisonLocaleContent = {
  name: 'PostHog',
  logo: '/tools/posthog-logo.svg',
  seo: {
    title: 'Betterlytics vs PostHog: Alternativa leggera e focalizzata',
    description:
      'Confronta Betterlytics con PostHog. Analytics web focalizzate con uno script leggerissimo, privacy di default e prezzi prevedibili. Niente complessità, solo chiarezza.',
    keywords: [
      'alternativa PostHog',
      'analytics leggere',
      'analytics privacy-first',
      'analytics web semplici',
      'analytics senza cookie',
      'sostituto PostHog',
      'prezzi prevedibili analytics',
    ],
  },
  hero: {
    title: 'Cerchi un’alternativa a PostHog?',
    titleHighlight: 'alternativa',
    subtitle:
      'Betterlytics offre web analytics leggeri e focalizzati, con prezzi semplici e un impatto minimo; per team che vogliono chiarezza, non complessità.',
  },
  keyDifferentiators: [
    {
      title: 'Davvero leggero',
      betterlytics: 'Script sotto i 2KB, progettato per un impatto minimo sulle performance della pagina.',
      competitor: 'Script di circa 57KB con un ampio set di funzionalità e maggiore overhead di caricamento.',
    },
    {
      title: 'Privacy di default',
      betterlytics: 'Senza cookie per progettazione. Nessun banner cookie necessario.',
      competitor: 'Utilizza cookie di default. La modalità senza cookie è disponibile con configurazione.',
    },
    {
      title: 'Prezzi semplici e prevedibili',
      betterlytics:
        'Piano gratuito per sempre per siti piccoli. Piani a pagamento da $6/mese con le funzionalità principali incluse.',
      competitor:
        'Piano gratuito generoso, ma la fatturazione basata sull’utilizzo su più prodotti diventa complessa con la crescita.',
    },
  ],
  comparison: {
    categories: [
      {
        name: 'Privacy e conformità',
        features: [
          { name: 'Tracciamento senza cookie', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Pronto per il GDPR di default', betterlytics: true, competitor: 'Con configurazione' },
          {
            name: 'Nessun banner cookie necessario',
            betterlytics: true,
            competitor: 'Dipende dalla configurazione',
          },
          { name: 'Hosting dei dati in UE', betterlytics: true, competitor: 'Opzionale' },
          { name: 'Privacy-first di default', betterlytics: true, competitor: false },
          { name: 'Nessun cross-site tracking', betterlytics: true, competitor: true },
          { name: 'Piena proprietà dei dati', betterlytics: true, competitor: true },
          { name: 'Open source', betterlytics: true, competitor: true },
          { name: 'Opzione self-hosting', betterlytics: true, competitor: true },
        ],
      },
      {
        name: 'Performance e velocità',
        features: [
          { name: 'Dimensione dello script', betterlytics: '<2KB', competitor: '~57KB' },
          { name: 'Impatto sul caricamento della pagina', betterlytics: 'Minimo', competitor: 'Moderato' },
          { name: 'Funziona con ad blocker', betterlytics: true, competitor: 'Parziale' },
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
          { name: 'Session replay', betterlytics: true, competitor: true },
          { name: 'Core Web Vitals', betterlytics: true, competitor: true },
          { name: 'Uptime monitoring', betterlytics: true, competitor: false },
          { name: 'Feature flag', betterlytics: false, competitor: true },
          { name: 'A/B testing', betterlytics: false, competitor: true },
          { name: 'Sondaggi (NPS / CSAT)', betterlytics: false, competitor: true },
          { name: 'Heatmap', betterlytics: false, competitor: true },
          { name: 'Analytics per app mobile', betterlytics: false, competitor: true },
        ],
      },
      {
        name: 'Facilità d’uso',
        features: [
          {
            name: 'Tempo di configurazione',
            betterlytics: '<5 minuti',
            competitor: 'Configurazione iniziale più lunga',
          },
          { name: 'Curva di apprendimento', betterlytics: 'Bassa', competitor: 'Media' },
          { name: 'Interfaccia semplice e focalizzata sugli analytics', betterlytics: true, competitor: false },
          { name: 'Configurazione minima richiesta', betterlytics: true, competitor: false },
          { name: 'Conservazione dei dati', betterlytics: 'Fino a 5 anni', competitor: 'Fino a 7 anni' },
        ],
      },
      {
        name: 'Prezzi e supporto',
        features: [
          { name: 'Piano gratuito disponibile', betterlytics: true, competitor: true },
          { name: 'Prezzi prevedibili', betterlytics: true, competitor: false },
          { name: 'Supporto via email', betterlytics: true, competitor: true },
        ],
      },
    ],
  },
  detailedComparison: [
    {
      title: 'Focalizzato vs tutto-in-uno',
      content: `PostHog racchiude moltissime funzionalità in un’unica piattaforma: product analytics, feature flag, A/B testing, session replay, sondaggi e altro ancora. Ottimo per grandi team di prodotto che hanno bisogno di tutto.\n\nMa se ti servono solo web analytics, rischi di pagare per funzionalità che non usi. Betterlytics si concentra su ciò che conta: analytics, session replay, funnel, percorsi utente e monitoring. Sei operativo in 5 minuti, senza dover diventare un esperto di product analytics.`,
      icon: 'target',
    },
    {
      title: 'La velocità della pagina conta',
      content: `Lo script di PostHog pesa circa 57KB (gzip). Include feature flag, session recording, autocapture e molte altre funzionalità. Su mobile o connessioni lente, questo peso si fa sentire.\n\nIl nostro script? Meno di 2KB. Le pagine restano veloci, i Core Web Vitals restano verdi e la SEO ringrazia. Gli analytics non dovrebbero rallentare il tuo sito.`,
      icon: 'zap',
    },
    {
      title: 'Privacy pronta all’uso',
      content: `PostHog utilizza cookie di default. È possibile configurare una modalità senza cookie, ma richiede configurazione aggiuntiva e può limitare alcune funzionalità. In molti casi, questo comporta la necessità di un banner di consenso per il GDPR.\n\nBetterlytics è senza cookie fin dall’inizio. Nessuna configurazione, nessun banner cookie, nessun popup fastidioso per i visitatori.`,
      icon: 'shield',
    },
    {
      title: 'Sai sempre quanto spendi',
      content: `PostHog fattura separatamente eventi, session replay, feature flag, sondaggi e altro. Il piano gratuito è generoso, ma i costi possono crescere rapidamente con l’aumento dell’utilizzo, rendendo la spesa mensile meno prevedibile.\n\nNoi manteniamo tutto semplice: prezzo fisso da $6/mese con limiti chiari sugli eventi. Session replay, monitoring e analytics principali inclusi. Nessun foglio di calcolo per capire quanto devi pagare.`,
      icon: 'dollar',
    },
    {
      title: 'Dove PostHog vince',
      content: `Va riconosciuto: PostHog eccelle in feature flag, A/B testing e sperimentazione di prodotto. Se gestisci esperimenti continui e hai bisogno di un controllo granulare delle funzionalità, è difficile da battere.\n\nMa se vuoi web analytics puliti, con session replay e uptime monitoring, senza imparare una piattaforma complessa, Betterlytics è la scelta giusta. Noi facciamo analytics molto bene. PostHog fa molte cose abbastanza bene.`,
      icon: 'layers',
    },
  ],
  cta: {
    eyebrow: 'Semplicità prima di tutto',
    title: 'Vuoi analytics senza complessità?',
    subtitle: 'Web analytics focalizzata. Script leggero. Prezzi chiari e prevedibili.',
    buttonText: 'Inizia la prova gratuita',
  },
};
