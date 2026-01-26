import type { ChangelogEntryData } from '@/entities/system/changelog.entities';

export const latestChangelogModalIt: ChangelogEntryData = {
  metadata: {
    version: 'v1.3.3',
    releasedAt: '2026-01-26',
    title: 'Scroll Depth & Miglioramenti UI',
    summary: 'Traccia la profondità dello scroll per capire meglio engagement e comportamento di scrolling.',
  },
  sections: [
    {
      id: 'v133-new-features',
      title: 'Nuove funzionalità',
      blocks: [
        {
          type: 'list',
          items: [
            'Scroll Depth Tracking: Scopri fino a che punto gli utenti scorrono le tue pagine per comprendere meglio engagement e punti di abbandono.',
          ],
        },
      ],
    },
    {
      id: 'v133-improvements',
      title: 'Miglioramenti',
      blocks: [
        {
          type: 'list',
          items: [
            'Sidebar collassabile: le categorie della sidebar sono ora collassabili, dandoti più controllo sullo spazio di navigazione.',
            'Soglie Core Web Vitals: indicatori migliorati rendono più facile vedere quando le metriche superano le soglie "Fair" o "Poor".',
            'Reset quota di utilizzo: aggiunta un’etichetta chiara nel riepilogo per mostrare quando la tua quota mensile si resetta.',
            'UI Polish: aggiunte animazioni sottili in tutta l’app per un’esperienza più fluida.',
          ],
        },
      ],
    },
    {
      id: 'v133-fixes',
      title: 'Correzioni',
      blocks: [
        {
          type: 'list',
          items: [
            'Risolto un problema per cui Realtime non si aggiornava correttamente, mostrando dati obsoleti.',
          ],
        },
      ],
    },
  ],
};

export const changelogEntriesIt: readonly ChangelogEntryData[] = [
  {
    metadata: {
      version: 'v1.3.3',
      releasedAt: '2026-01-26',
      title: 'Scroll Depth & Onboarding migliorata',
      summary:
        'Traccia la profondità dello scroll per capire engagement e abbandoni, e configura tutto più velocemente con nuove guide di onboarding per i framework.',
    },
    sections: [
      {
        id: 'v133-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'Scroll Depth Tracking: Scopri fino a che punto gli utenti scorrono le tue pagine per comprendere meglio engagement e comportamento di scrolling.',
              'Guide di onboarding ampliate: abbiamo migliorato l’onboarding con istruzioni di installazione più chiare, passo dopo passo, per molti più framework.',
            ],
          },
        ],
      },
      {
        id: 'v133-improvements-and-ux',
        title: 'Miglioramenti & UX',
        blocks: [
          {
            type: 'list',
            items: [
              'Sidebar collassabile: le categorie della sidebar sono ora collassabili, dandoti più controllo sullo spazio di navigazione.',
              'Indicatori Core Web Vitals migliorati: ora è più facile vedere quando le metriche superano le soglie "Fair" o "Poor".',
              'Reset quota di utilizzo: aggiunta un’etichetta chiara nel riepilogo per mostrare quando la tua quota mensile si resetta.',
              'UI polish: aggiunte animazioni sottili in tutta l’app per un’esperienza più fluida e reattiva.',
            ],
          },
        ],
      },
      {
        id: 'v133-fixes',
        title: 'Correzioni',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolto un problema per cui Realtime non si aggiornava correttamente, mostrando dati obsoleti.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.2',
      releasedAt: '2026-01-19',
      title: 'Correzioni bug e miglioramenti UI',
      summary: "Una release più piccola questa volta! Abbiamo risolto alcuni bug e migliorato l'interfaccia.",
    },
    sections: [
      {
        id: 'v132-fixes',
        title: 'Correzioni',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolto un problema per cui le impostazioni della dashboard apparivano modificabili per i membri del team senza permessi di amministratore.',
              'Risolto un problema per cui la ricerca nei filtri smetteva di funzionare dopo aver selezionato più valori.',
            ],
          },
        ],
      },
      {
        id: 'v132-improvements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: ["Vari miglioramenti minori all'interfaccia per un'esperienza più curata."],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.1',
      releasedAt: '2026-01-11',
      title: 'Collaborazione in team e rafforzamento della sicurezza',
      summary:
        "Invita i membri del team a collaborare sulle tue dashboard con accesso basato sui ruoli. Questa versione rafforza anche la sicurezza dell'account, migliora l'isolamento della privacy e permette di modificare il dominio della dashboard.",
    },
    sections: [
      {
        id: 'v131-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'Invita i membri del team alla tua dashboard come Visualizzatore, Editore o Amministratore, con permessi basati sui ruoli per collaborare in sicurezza.',
              'I filtri ora supportano la logica OR, permettendoti di selezionare più valori in un singolo filtro (ad esempio, più pagine o paesi).',
              'Ora puoi modificare il dominio della dashboard dalle impostazioni. Il Site ID e lo script di tracciamento rimangono invariati, quindi non servono modifiche al codice.',
            ],
          },
        ],
      },
      {
        id: 'v131-security',
        title: 'Sicurezza',
        blocks: [
          {
            type: 'list',
            items: [
              'La modifica della password ora invalida tutte le altre sessioni attive.',
              'Il ripristino della password ora disconnette tutte le sessioni esistenti per una maggiore protezione.',
            ],
          },
        ],
      },
      {
        id: 'v131-improvements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: [
              'Migliorate le protezioni della privacy per isolare meglio i dati dei visitatori tra siti diversi.',
              'Corretta la spaziatura del layout nella lista di monitoraggio uptime su schermi più grandi.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.0',
      releasedAt: '2026-01-04',
      title: 'Monitoraggio Uptime e SSL, User Journey più chiari',
      summary:
        'Betterlytics ora ti aiuta a monitorare l’uptime dei tuoi siti web e lo stato dei certificati SSL, con avvisi in caso di downtime o scadenza. Questa release rende inoltre le User Journey più facili da esplorare e migliora l’accuratezza delle analisi.',
    },
    sections: [
      {
        id: 'v130-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'È ora disponibile il monitoraggio dell’uptime dei siti web. Tieni traccia di uptime, latenza ed eventi critici e ricevi notifiche quando qualcosa non funziona.',
              'Il monitoraggio dei certificati SSL è incluso nell’uptime monitoring, con avvisi prima della scadenza o in caso di certificati non validi.',
              'I percorsi delle User Journey possono ora essere bloccati nel diagramma Sankey, rendendo più semplice seguire e analizzare specifici flussi utente anche in journey complesse.',
            ],
          },
        ],
      },
      {
        id: 'v130-improvements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: [
              'I diagrammi Sankey delle User Journey sono stati ulteriormente rifiniti dal punto di vista visivo per ridurre il disordine e rendere i percorsi più leggibili.',
              'Durante la creazione dei funnel vengono ora suggeriti set di valori dei filtri più completi, per costruire funnel accurati più velocemente.',
              'I report su browser e dispositivi sono stati migliorati con icone più riconoscibili.',
              'La pagina dei prezzi include ora una tabella di confronto più chiara per comprendere meglio le differenze tra i piani.',
            ],
          },
        ],
      },
      {
        id: 'v130-fixes',
        title: 'Correzioni',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolto un problema in cui alcune metriche delle campagne erano etichettate in modo errato.',
              'Migliorati lo scorrimento e le prestazioni della tabella degli eventi.',
            ],
          },
        ],
      },
      {
        id: 'v130-maintenance',
        title: 'Manutenzione',
        blocks: [
          {
            type: 'list',
            items: [
              'Aggiornamenti generali di sicurezza e delle dipendenze per mantenere Betterlytics stabile e sicuro.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.9',
      releasedAt: '2025-12-21',
      title: 'Filtri salvati, filtro per hostname e miglioramenti a User Journey',
      summary:
        'Salva le tue combinazioni di filtri preferite per un accesso rapido, filtra le analisi per hostname per configurazioni multi-sottodominio, e User Journey riceve gli ultimi ritocchi per diagrammi più fluidi.',
    },
    sections: [
      {
        id: 'v129-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'Ora puoi salvare combinazioni di filtri e applicarle rapidamente in seguito, perfetto per le visualizzazioni più utilizzate o configurazioni complesse.',
              'Il filtro per hostname è disponibile! Se hai più sottodomini che puntano alla stessa dashboard, puoi filtrare le analisi per hostname per vedere i dati di sottodomini specifici.',
            ],
          },
        ],
      },
      {
        id: 'v129-improvements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey ha ricevuto gli ultimi ritocchi. I diagrammi di grandi dimensioni ora scorrono più fluidamente e sono più facili da seguire.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.8',
      releasedAt: '2025-12-14',
      title: 'User Journey ridisegnato, clonazione dei funnel e miglioramenti all’affidabilità della piattaforma',
      summary:
        'User Journey riceve un completo aggiornamento visivo, i funnel ora possono essere clonati e i miglioramenti in affidabilità e precisione dei dati migliorano l’esperienza utente.',
    },
    sections: [
      {
        id: 'v128-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'La visualizzazione di User Journey è stata ridisegnata con un’interfaccia moderna che rende più semplice comprendere come i visitatori navigano sul tuo sito.',
              'Ora puoi clonare i funnel esistenti per creare rapidamente varianti o testare diverse configurazioni senza dover ripartire da zero.',
            ],
          },
        ],
      },
      {
        id: 'v128-security',
        title: 'Sicurezza',
        blocks: [
          {
            type: 'list',
            items: [
              'Next.js e React sono stati aggiornati per correggere vulnerabilità di sicurezza recentemente divulgate e proteggere i tuoi dati e account.',
            ],
          },
        ],
      },
      {
        id: 'v128-improvements-and-fixes',
        title: 'Miglioramenti e correzioni',
        blocks: [
          {
            type: 'list',
            items: [
              'La precisione dei dati di User Journey è stata migliorata per offrire informazioni più affidabili sui percorsi dei visitatori.',
              'I colori della mappa geografica e della heatmap settimanale sono stati aggiornati per evidenziare meglio le differenze nel numero di visitatori.',
              'Risolto un problema che impediva il cambio della password per gli account che utilizzano accesso tramite email e password.',
              'Le modifiche alle impostazioni richiedono ora il clic su "Salva" prima di essere applicate, evitando cambiamenti accidentali.',
              'Corretto un bug per cui i tooltip dell’intervallo di confronto mostravano date errate.',
              'Risolto un problema che poteva impedire il corretto rendering dei grafici a causa delle annotazioni.',
              'Introdotto un nuovo endpoint di tracciamento /event con una semantica più chiara e un migliore allineamento alla nostra architettura privacy-first. Le integrazioni esistenti basate su /track continuano a funzionare senza modifiche.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.7',
      releasedAt: '2025-12-07',
      title: 'Annotazioni dei grafici, visualizzazione centrata sulle campagne e rafforzamento della sicurezza',
      summary:
        "La pagina delle campagne ora si concentra sulle campagne UTM nominate, i grafici principali supportano le annotazioni, l'autenticazione è stata rafforzata e diverse correzioni migliorano precisione e sicurezza.",
    },
    sections: [
      {
        id: 'v127-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'La pagina delle campagne è stata completamente ricostruita per concentrarsi sulle campagne UTM nominate, offrendo informazioni più chiare e significative rispetto alla visualizzazione aggregata precedente.',
              'Ora puoi aggiungere annotazioni ai grafici principali per evidenziare eventi importanti, rilasci o variazioni del traffico.',
              'La cancellazione di una dashboard include ora un breve conto alla rovescia di sicurezza per evitare rimozioni accidentali.',
            ],
          },
        ],
      },
      {
        id: 'v127-security-auth',
        title: 'Sicurezza & Autenticazione',
        blocks: [
          {
            type: 'list',
            items: [
              "L'autenticazione è stata rafforzata, migliorando l'integrità della sessione e la protezione complessiva.",
              "Vulnerabilità recente di React Server Components (CVE-2025-66478) corretta aggiornando all'ultima versione sicura di Next.js.",
            ],
          },
        ],
      },
      {
        id: 'v127-improvements-and-fixes',
        title: 'Miglioramenti & Correzioni',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolta una race condition che poteva generare abbonamenti duplicati durante la creazione di nuovi account.',
              "Corrette le metriche pagine-per-sessione nella vista Pages, ora rispecchiano correttamente l'utilizzo effettivo.",
              "La verifica dell'account fornisce ora feedback più chiari durante il processo di verifica.",
              'Il layout del popup del changelog è ora ottimizzato per schermi piccoli, migliorando la leggibilità sui dispositivi mobili.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.6',
      releasedAt: '2025-12-01',
      title: 'Funnel Ridisegnati e Mappe Più Intelligenti',
      summary:
        'I funnel sono stati completamente ridisegnati con visualizzazioni migliorate. Le interazioni sulla mappa mondiale includono ora funzionalità di confronto e tooltip più chiari. Questa versione include anche correzioni di bug e traduzioni aggiornate.',
    },
    sections: [
      {
        id: 'v126-new-features',
        title: 'Nuove Funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'La pagina dei funnel ha un layout completamente nuovo, visivo e più intuitivo da usare.',
              'La mappa mondiale ora supporta confronti tra periodi diversi.',
              'I tooltip sulla mappa mondiale forniscono informazioni più chiare e prestazioni migliorate.',
            ],
          },
        ],
      },
      {
        id: 'v126-enhancements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: ['Aggiunte traduzioni mancanti per offrire un’esperienza più uniforme a tutti gli utenti.'],
          },
        ],
      },
      {
        id: 'v126-bug-fixes',
        title: 'Correzioni di Bug',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolte notifiche duplicate quando si superano i limiti del piano.',
              'Risolti problemi di caricamento quando si selezionano intervalli di date futuri.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.5',
      releasedAt: '2025-11-23',
      title: '',
      summary: '',
    },
    sections: [
      {
        id: 'v125-new-features',
        title: 'Nuove funzionalità',
        blocks: [
          {
            type: 'list',
            items: [
              'Confronta i periodi direttamente nella visualizzazione della mappa del mondo.',
              'Blocca gli eventi da indirizzi IP specifici per evitare traffico distorto o indesiderato (ad esempio le tue visite).',
              'Rifiuta automaticamente gli eventi da domini che non corrispondono al dominio della dashboard.',
            ],
          },
        ],
      },
      {
        id: 'v125-enhancements',
        title: 'Miglioramenti',
        blocks: [
          {
            type: 'list',
            items: [
              'Le etichette dei Core Web Vitals sono state affinate per una comprensione più chiara.',
              'L’Antartide viene nascosta dalla mappa del mondo a meno che non ci siano dati di visitatori.',
              'Aggiunto un pulsante "Segnala un bug" direttamente nell’app per inviare feedback rapidi.',
              'Aggiunti favicon ai domini della dashboard.',
            ],
          },
        ],
      },
      {
        id: 'v125-bug-fixes',
        title: 'Correzioni di bug',
        blocks: [
          {
            type: 'list',
            items: [
              'Risolto un problema che causava il mancato caricamento della pagina Core Web Vitals.',
              'Risolti i problemi legati all’ora legale che influenzavano le analisi visualizzate.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.4',
      releasedAt: '2025-11-16',
      title: 'Workspace Demo Live & Landing Page Aggiornata',
      summary:
        'Questo aggiornamento introduce un nuovo workspace demo interattivo, una landing page ridisegnata e un monitoraggio delle performance migliorato per mantenere i dashboard veloci e affidabili.',
    },
    sections: [
      {
        id: 'v124-live-demo-workspace',
        title: 'Workspace Demo Live',
        blocks: [
          {
            type: 'text',
            body: 'Ora puoi esplorare Betterlytics tramite un workspace demo completamente interattivo.',
          },
          {
            type: 'list',
            items: [
              'Esplora dashboard, funnel e tabelle con dati di esempio precompilati',
              'Testa filtri, suddivisioni e confronti senza toccare i dati di produzione',
              'Condividi la demo con i colleghi per mostrare le capacità della piattaforma',
            ],
          },
        ],
      },
      {
        id: 'v124-redesigned-landing-page',
        title: 'Landing Page Ridisegnata',
        blocks: [
          {
            type: 'text',
            body: 'Il sito pubblico è stato aggiornato con messaggi più chiari, nuovi elementi visivi e una navigazione migliorata per aiutare i visitatori a capire meglio cosa offre Betterlytics.',
          },
          {
            type: 'list',
            items: [
              'Testi aggiornati che evidenziano funzionalità chiave come analytics, funnel e session replay',
              'Nuovi screenshot che riflettono il prodotto attuale anche in visualizzazione mobile',
            ],
          },
        ],
      },
      {
        id: 'v124-performance-monitoring',
        title: 'Monitoraggio delle Performance Migliorato',
        blocks: [
          {
            type: 'text',
            body: 'Abbiamo rafforzato la telemetria interna della piattaforma per rilevare i rallentamenti prima e mantenere i dashboard reattivi.',
          },
          {
            type: 'list',
            items: [
              'Identificazione più rapida dei problemi che influiscono sui tempi di query o di caricamento',
              'Maggiori informazioni sul comportamento degli ambienti per un’esperienza più stabile',
              'Una base più solida per ulteriori miglioramenti delle performance',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.3',
      releasedAt: '2025-10-26',
      title: 'Ricerca più Intelligente, Filtri più Chiari & Miglioramenti di Stabilità',
      summary:
        'Questo aggiornamento introduce ricerca e filtraggio migliorati, visualizzazioni più informative, session replay più affidabile e diversi miglioramenti di stabilità e UX.',
    },
    sections: [
      {
        id: 'v123-search-filters',
        title: 'Ricerca & Filtri Migliorati',
        blocks: [
          {
            type: 'text',
            body: 'La ricerca e i filtri ora scalano meglio con grandi dataset, rendendo più semplice trovare le informazioni necessarie.',
          },
          {
            type: 'list',
            items: [
              'Opzioni di ricerca avanzate per scoprire rapidamente eventi, pagine e proprietà importanti',
              'Dashboard panoramiche più reattive con limiti adeguati per workspace di grandi dimensioni',
              'Le impostazioni dei filtri sono ora riflesse nell’URL, rendendo facile salvare e condividere le viste filtrate',
              'Correzioni nella selezione dei filtri e nelle tabelle gerarchiche per divisioni più affidabili',
            ],
          },
        ],
      },
      {
        id: 'v123-visual-context',
        title: 'Maggiore Contesto nelle Visualizzazioni',
        blocks: [
          {
            type: 'text',
            body: 'Diversi componenti visivi mostrano ora dettagli aggiuntivi per interpretare i trend più rapidamente e con meno clic.',
          },
          {
            type: 'list',
            items: [
              'Dettagli dispositivi espandibili con browser e piattaforme specifici',
              'Heatmap settimanali con tooltip che mostrano conteggi e orari precisi',
              'Riepiloghi "Nessuna modifica" per evidenziare chiaramente i periodi di confronto stabili',
            ],
          },
        ],
      },
      {
        id: 'v123-session-replay',
        title: 'Miglioramenti del Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'I session replay sono ora più affidabili e accurati, permettendoti di rivedere con sicurezza le interazioni degli utenti senza perdere eventi chiave.',
          },
          {
            type: 'list',
            items: [
              'Registrazioni più affidabili e precise delle interazioni degli utenti',
              'Riproduzione delle sessioni migliorata per catturare correttamente le azioni importanti',
            ],
          },
        ],
      },
      {
        id: 'v123-timezone-alignment',
        title: 'Allineamento dei Dashboard alla Timezone',
        blocks: [
          {
            type: 'text',
            body: 'I dashboard ora mostrano l’orario locale di ciascun utente per una reportistica più intuitiva.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.2',
      releasedAt: '2025-10-20',
      title: 'Session Replay Privacy-First & Dashboard più Veloci',
      summary:
        'Questa versione introduce session replay anonimizzato, miglioramenti delle performance dei dashboard e traduzioni aggiornate per un’esperienza globale più fluida.',
    },
    sections: [
      {
        id: 'v122-session-replay',
        title: 'Session Replay Privacy-First',
        blocks: [
          {
            type: 'text',
            body: 'Il session replay è ora disponibile e mostra registrazioni anonimizzate di come i visitatori interagiscono con il tuo sito. Le informazioni sensibili come testo, campi dei moduli e immagini vengono automaticamente mascherate per proteggere la privacy.',
          },
          {
            type: 'list',
            items: [
              'Comprendere dove gli utenti esitano, scorrono o abbandonano la pagina',
              'Individuare segnali di frustrazione come i rage click',
              'Condividere le registrazioni con il team senza esporre dati personali',
            ],
          },
        ],
      },
      {
        id: 'v122-faster-dashboards',
        title: 'Dashboard più Veloci e Fluidi',
        blocks: [
          {
            type: 'text',
            body: 'Abbiamo ridotto i rendering non necessari nelle viste principali, rendendo i dashboard più reattivi, specialmente nei workspace più grandi. Navigare tra i report e applicare filtri ora è più veloce.',
          },
        ],
      },
      {
        id: 'v122-translation-improvements',
        title: 'Miglioramenti nelle Traduzioni',
        blocks: [
          {
            type: 'text',
            body: 'Le traduzioni mancanti e le incoerenze nel testo sono state aggiornate, offrendo un’esperienza più uniforme e rifinita per i team internazionali.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.1',
      releasedAt: '2025-09-22',
      title: 'Intervalli Temporali Più Intelligenti & Metriche Panoramiche più Accurate',
      summary:
        'Questa versione aggiunge intervalli temporali e di confronto più ricchi, corregge incongruenze nelle metriche panoramiche e migliora l’accessibilità e l’usabilità su mobile.',
    },
    sections: [
      {
        id: 'v121-time-comparison',
        title: 'Intervalli Temporali & Confronto Più Intelligenti',
        blocks: [
          {
            type: 'text',
            body: 'I controlli degli intervalli temporali offrono ora più opzioni preimpostate e scelte di confronto più chiare, aiutandoti a rispondere più velocemente alle domande comuni di report.',
          },
          {
            type: 'list',
            items: [
              'Passa rapidamente a intervalli come ultime 24 ore, ultimi 7 giorni, ultimi 14 giorni o ultimo trimestre',
              'Confronta le performance con il periodo precedente o con l’anno scorso, con l’opzione di allineare i giorni della settimana',
              'I selettori di intervallo e confronto sono ora separati per maggiore chiarezza e controllo',
            ],
          },
        ],
      },
      {
        id: 'v121-overview-metrics',
        title: 'Metriche Panoramiche più Accurate',
        blocks: [
          {
            type: 'text',
            body: 'Alcuni miglioramenti garantiscono report più affidabili nella pagina panoramica.',
          },
          {
            type: 'list',
            items: [
              'I valori delle schede di riepilogo sono ora completamente sincronizzati con grafici e tabelle sottostanti',
              'Il conteggio delle visualizzazioni di pagina è stato migliorato per evitare che le schede inattive aumentino i totali',
            ],
          },
        ],
      },
      {
        id: 'v121-accessibility',
        title: 'Migliorata Accessibilità & Usabilità Mobile',
        blocks: [
          {
            type: 'text',
            body: 'Abbiamo continuato a migliorare l’usabilità generale di Betterlytics, soprattutto per il login e per i team che lavorano su schermi più piccoli.',
          },
          {
            type: 'list',
            items: [
              'I form di login funzionano meglio con la navigazione da tastiera e le tecnologie assistive',
              'I layout mobile sono stati migliorati per facilitare l’interazione con dashboard e controlli su schermi piccoli',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.0',
      releasedAt: '2025-09-14',
      title: 'Heatmap Settimanale, Nuova UI & Core Web Vitals',
      summary:
        'Questo aggiornamento introduce un completo redesign del sito Betterlytics, un heatmap settimanale di engagement, metriche aggiornate nella panoramica, onboarding guidato per i nuovi workspace e monitoraggio dei Core Web Vitals con dati reali.',
    },
    sections: [
      {
        id: 'v120-redesign',
        title: 'Redesign Completo del Sito e dei Dashboard',
        blocks: [
          {
            type: 'text',
            body: 'L’intero sito e tutti i dashboard sono stati aggiornati con un tema visivo rinnovato, colori uniformi, tipografia coerente e layout migliorato. Navigazione, tabelle, grafici, dialog e tooltip sono stati perfezionati per un’esperienza più pulita e intuitiva su desktop e mobile.',
          },
        ],
      },
      {
        id: 'v120-weekly-heatmap',
        title: 'Heatmap Settimanale di Engagement',
        blocks: [
          {
            type: 'text',
            body: 'La pagina panoramica ora include una heatmap settimanale che mostra i pattern di traffico per giorno e ora. Individua rapidamente i periodi di picco, le ore più tranquille e eventuali picchi insoliti di attività.',
          },
        ],
      },
      {
        id: 'v120-overview-context',
        title: 'Maggiore Contesto nei Grafici Panoramici',
        blocks: [
          {
            type: 'text',
            body: 'Sono state aggiunte due nuove schede metriche al grafico panoramico: numero totale di sessioni e durata media delle visite. Questo aiuta a collegare le tendenze del traffico con il tempo effettivo trascorso dagli utenti sul sito.',
          },
        ],
      },
      {
        id: 'v120-sparkline-trends',
        title: 'Trend Sparkline più Dettagliati',
        blocks: [
          {
            type: 'text',
            body: 'Le sparklines nelle schede di riepilogo supportano intervalli temporali più dettagliati, offrendo una visione più chiara di come le metriche si muovono nel range selezionato. Picchi o cali temporanei sono più facili da individuare senza aprire un report completo.',
          },
        ],
      },
      {
        id: 'v120-guided-onboarding',
        title: 'Onboarding Guidato per Nuovi Utenti',
        blocks: [
          {
            type: 'text',
            body: 'I nuovi account ricevono ora un onboarding passo-passo che copre l’aggiunta dello script di tracking e l’esplorazione dei dashboard principali, rendendo la configurazione più rapida e semplice.',
          },
        ],
      },
      {
        id: 'v120-core-web-vitals',
        title: 'Core Web Vitals dai Veri Utenti',
        blocks: [
          {
            type: 'text',
            body: 'Betterlytics ora cattura i Core Web Vitals direttamente dalle sessioni dei visitatori reali, offrendo una visione accurata delle performance del sito. Usa queste metriche per identificare e correggere regressioni prima che influenzino le conversioni.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.1',
      releasedAt: '2025-08-24',
      title: 'Monitoraggio Link Esterni, Intervalli Temporali Rapidi & Localizzazione Italiana',
      summary:
        'Ora puoi monitorare i clic sui link esterni, usare nuove scorciatoie per intervalli temporali rapidi e accedere a Betterlytics in italiano.',
    },
    sections: [
      {
        id: 'v111-outbound-links',
        title: 'Monitoraggio Link Esterni',
        blocks: [
          {
            type: 'text',
            body: 'Il monitoraggio dei link esterni è ora disponibile e mostra quali destinazioni esterne ricevono più interazioni. Questo ti aiuta a valutare le performance delle CTA verso partner, documentazione o altri siti esterni.',
          },
        ],
      },
      {
        id: 'v111-time-range-shortcuts',
        title: 'Scorciatoie per Intervalli Temporali Rapidi',
        blocks: [
          {
            type: 'text',
            body: 'Il selettore degli intervalli temporali include ora più opzioni rapide e intervalli dettagliati, rendendo più facile passare a finestre di report comuni o analizzare i trend senza selezione manuale delle date.',
          },
        ],
      },
      {
        id: 'v111-italian-localization',
        title: 'Localizzazione Italiana',
        blocks: [
          {
            type: 'text',
            body: 'Il dashboard è ora disponibile in italiano, offrendo un’esperienza più naturale per i team di lingua italiana in navigazione, report e impostazioni.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.0',
      releasedAt: '2025-08-15',
      title: 'Dashboard Localizzate, Mappe Intelligenti & Confronti Più Ricchi',
      summary:
        'I dashboard sono ora disponibili in più lingue, la mappa mondiale è più intuitiva da esplorare e i valori di confronto appaiono in più grafici e indicatori di progresso.',
    },
    sections: [
      {
        id: 'v110-dashboard-localization',
        title: 'Localizzazione dei Dashboard',
        blocks: [
          {
            type: 'text',
            body: 'Tutte le principali pagine dei dashboard sono ora localizzate, permettendo ai team di navigare, leggere etichette e visualizzare metriche nella lingua preferita.',
          },
        ],
      },
      {
        id: 'v110-world-map',
        title: 'Interazioni Migliorate sulla Mappa Mondiale',
        blocks: [
          {
            type: 'text',
            body: 'La mappa mondiale è stata perfezionata per rendere più semplice passare il mouse, selezionare e confrontare le regioni. Le aree più piccole o dense reagiscono in modo più fluido e i raggruppamenti regionali sono più chiari a colpo d’occhio.',
          },
        ],
      },
      {
        id: 'v110-comparison-values',
        title: 'Valori di Confronto Espansi',
        blocks: [
          {
            type: 'text',
            body: 'Più grafici e barre di progresso ora includono tooltip con valori di confronto, rendendo più facile vedere come le performance attuali si confrontano con il riferimento senza cambiare vista.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.2',
      releasedAt: '2025-08-13',
      title: 'Miglioramenti Mappa Mondiale & Tracciamento Eventi Più Preciso',
      summary:
        'Questo aggiornamento migliora la chiarezza della visualizzazione della mappa mondiale e introduce una normalizzazione intelligente degli URL per report sugli eventi più accurati.',
    },
    sections: [
      {
        id: 'v102-world-map',
        title: 'Miglioramenti della Mappa Mondiale',
        blocks: [
          {
            type: 'text',
            body: 'La mappa mondiale è stata aggiornata con elementi visivi più chiari e bandiere dei paesi, rendendo più facile capire da dove proviene il traffico. Contrasto e icone sono stati migliorati per una migliore leggibilità.',
          },
        ],
      },
      {
        id: 'v102-cleaner-urls',
        title: 'URL Eventi più Puliti',
        blocks: [
          {
            type: 'text',
            body: 'Gli URL degli eventi vengono ora normalizzati automaticamente, rimuovendo variazioni come barre finali o "www", così il traffico simile viene raggruppato correttamente per report coerenti.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.1',
      releasedAt: '2025-08-11',
      title: 'Accesso Social, Funnel & Avatar Gravatar',
      summary:
        'Questo aggiornamento introduce l’accesso tramite Google e GitHub, nuove analisi funnel per monitorare le perdite e avatar opzionali basati su Gravatar per i workspace.',
    },
    sections: [
      {
        id: 'v101-social-login',
        title: 'Accesso con Google & GitHub',
        blocks: [
          {
            type: 'text',
            body: 'Gli utenti possono ora accedere tramite Google o GitHub per semplificare l’onboarding e velocizzare la registrazione.',
          },
        ],
      },
      {
        id: 'v101-funnels',
        title: 'Funnel per Analisi dei Drop-Off',
        blocks: [
          {
            type: 'text',
            body: 'I funnel sono ora disponibili, permettendo di visualizzare come gli utenti si muovono attraverso percorsi multi-step e dove abbandonano. Usali per ottimizzare i flussi di iscrizione, onboarding e altre conversioni chiave.',
          },
        ],
      },
      {
        id: 'v101-gravatar',
        title: 'Avatar Gravatar',
        blocks: [
          {
            type: 'text',
            body: 'Gli utenti possono ora abilitare immagini del profilo basate su Gravatar, offrendo avatar semplici e riconoscibili senza necessità di caricamento.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.0',
      releasedAt: '2025-08-01',
      title: 'Betterlytics 1.0 + Autenticazione a Due Fattori',
      summary:
        'La prima versione stabile di Betterlytics introduce un’esperienza analitica affidabile insieme all’autenticazione a due fattori (TOTP) opzionale per una maggiore sicurezza dell’account.',
    },
    sections: [
      {
        id: 'v100-launch',
        title: 'Betterlytics 1.0',
        blocks: [
          {
            type: 'text',
            body: 'La versione 1.0 segna la prima release stabile di Betterlytics, raggruppando l’esperienza principale del dashboard in un prodotto pronto per la produzione per team che privilegiano analytics rispettosi della privacy.',
          },
        ],
      },
      {
        id: 'v100-totp',
        title: 'Autenticazione a Due Fattori (TOTP)',
        blocks: [
          {
            type: 'text',
            body: 'Gli utenti possono ora abilitare password monouso temporizzate (TOTP) per i loro account, aggiungendo un ulteriore livello di sicurezza oltre alla password. Qualsiasi app di autenticazione standard può essere utilizzata.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v0.1.0',
      releasedAt: '2025-04-25',
      title: 'Fondamenti Iniziali di Betterlytics',
      summary:
        'Abbiamo iniziato a costruire Betterlytics con focus su analytics rispettosi della privacy, un dashboard intuitivo e una pipeline di eventi veloce e affidabile.',
    },
    sections: [
      {
        id: 'v010-project-kickoff',
        title: 'Avvio del Progetto',
        blocks: [
          {
            type: 'text',
            body: 'Lo sviluppo è iniziato con un piccolo prototipo interno che combinava una pipeline di eventi, un dashboard iniziale e i primi esperimenti di visualizzazione. Sin dal primo giorno l’obiettivo era rendere le analytics affidabili, azionabili e conformi al GDPR.',
          },
        ],
      },
      {
        id: 'v010-performance-architecture',
        title: 'Architettura Orientata alle Prestazioni',
        blocks: [
          {
            type: 'text',
            body: 'Diversamente da molte piattaforme open-source di analytics in JavaScript o linguaggi simili, abbiamo dato priorità a velocità e scalabilità. Le prime decisioni includevano l’uso di Rust per calcoli efficienti e ClickHouse per storage ad alte prestazioni.',
          },
        ],
      },
      {
        id: 'v010-foundations',
        title: 'Fondamenti, Non Funzionalità',
        blocks: [
          {
            type: 'text',
            body: 'In questo periodo pre-1.0 il focus era sulla costruzione dell’architettura di base invece che sulle funzionalità pubbliche: progettare lo storage, modellare i dati e ottimizzare le query prima di aprire l’accesso a più persone.',
          },
        ],
      },
    ],
  },
] as const;
