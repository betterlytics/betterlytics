import type { ChangelogEntryData } from '@/entities/system/changelog.entities';

export const latestChangelogModalDa: ChangelogEntryData = {
  metadata: {
    version: 'v1.3.5',
    releasedAt: '2026-02-19',
    title: 'Nøgleordsovervågning & visuelle forbedringer',
    summary:
      'Uptime-monitorer kan nu give besked, hvis et forventet nøgleord mangler på dine sider. Dashboardet føles desuden glattere med animerede målere, tal og andre visuelle detaljer.',
  },
  sections: [
    {
      id: 'v135-new-features',
      title: 'Nye funktioner',
      blocks: [
        {
          type: 'list',
          items: [
            'Uptime-monitorer kan nu kontrollere, om et forventet nøgleord findes i sidens svar, og advare dig hvis vigtigt indhold mangler, selv når siden returnerer en 200-statuskode.',
          ],
        },
      ],
    },
    {
      id: 'v135-improvements',
      title: 'Forbedringer',
      blocks: [
        {
          type: 'list',
          items: [
            'Core Web Vitals-scorer vises nu i en animeret måler, så du hurtigere kan aflæse din sides ydeevne.',
            'Tooltips i grafer viser nu tydeligt, når en uge- eller månedsperiode kun er delvist dækket af det valgte tidsinterval.',
            'Tal, indlæsningsindikatorer og andre små visuelle detaljer er finpudset for en glattere og mere poleret oplevelse på tværs af dashboardet.',
          ],
        },
      ],
    },
  ],
};

export const changelogEntriesDa: readonly ChangelogEntryData[] = [
  {
    metadata: {
      version: 'v1.3.5',
      releasedAt: '2026-02-19',
      title: 'Nøgleordsovervågning & visuelle forbedringer',
      summary:
        'Uptime-monitorer kan nu give besked, hvis et forventet nøgleord mangler på dine sider. Dashboardet føles desuden glattere med animerede målere, tal og andre visuelle detaljer.',
    },
    sections: [
      {
        id: 'v135-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Uptime-monitorer kan nu kontrollere, om et forventet nøgleord findes i sidens svar, og advare dig hvis vigtigt indhold mangler — selv når siden returnerer en 200-statuskode.',
            ],
          },
        ],
      },
      {
        id: 'v135-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'Core Web Vitals-scorer vises nu i en animeret måler, så du hurtigere kan aflæse din sides ydeevne.',
              'Tooltips i grafer viser nu tydeligt, når en uge- eller månedsperiode kun er delvist dækket af det valgte tidsinterval.',
              'Tal, indlæsningsindikatorer og andre små visuelle detaljer er finpudset for en glattere og mere poleret oplevelse på tværs af dashboardet.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.4',
      releasedAt: '2026-02-08',
      title: 'E-mailrapporter & ugentlige og månedlige indsigter',
      summary:
        'Modtag planlagte e-mailrapporter for dine dashboards og analysér langsigtede trends med ugentlig og månedlig visning.',
    },
    sections: [
      {
        id: 'v134-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Planlæg e-mailrapporter med overblik over dine dashboards direkte fra indstillingerne.',
              'Ved længere tidsperioder kan data nu vises med ugentlig og månedlig opdeling, hvilket gør det lettere at identificere langsigtede trends.',
            ],
          },
        ],
      },
      {
        id: 'v134-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'Scroll depth-events er nu inkluderet uden ekstra omkostninger og tæller ikke med i dit månedlige forbrug.',
              'Filtervælgeren viser nu, hvor mange filtre der er aktive.',
              'Tabelceller viser nu sammenligningsdata tydeligere, når der mangler data for én af perioderne.',
            ],
          },
        ],
      },
      {
        id: 'v134-fixes',
        title: 'Fejlrettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem, hvor tracking-scriptet i visse tilfælde kunne sende ugyldige data.',
              'Rettet et problem i datoberegningen, som kunne medføre forkerte tidsperioder.',
              'Rettet en fejl, hvor e-mailbekræftelse ikke blev sendt korrekt ved tilmelding via OAuth.',
              'Rettet visning af sammenligningsindikatorer, når data manglede eller var uændrede.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.3',
      releasedAt: '2026-01-26',
      title: 'Scroll Depth & Forbedret onboarding',
      summary:
        'Spor scroll-dybde for at forstå engagement og frafald, og kom hurtigere i gang med nye onboarding-guides til flere frameworks.',
    },
    sections: [
      {
        id: 'v133-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Scroll Depth Tracking: Se hvor langt brugere scroller ned på dine sider for bedre at forstå engagement og scroll-adfærd.',
              'Udvidede onboarding-guides: Vi har forbedret onboarding med klare, trin-for-trin installationsinstruktioner til mange flere frameworks.',
            ],
          },
        ],
      },
      {
        id: 'v133-improvements-and-ux',
        title: 'Forbedringer & UX',
        blocks: [
          {
            type: 'list',
            items: [
              'Sammenklappelig sidebar: Sidebar-kategorier kan nu foldes sammen, så du får mere kontrol over navigationen.',
              'Forbedrede Core Web Vitals-indikatorer gør det lettere at se, når metrics krydser "Middel" eller "Dårlig"-grænser.',
              'Brugsgrænse nulstilles: Tilføjet en tydelig label i brugsoverblikket, der viser, hvornår din månedlige kvote nulstilles.',
              'UI-polering: Tilføjet subtile animationer i appen for en mere flydende og responsiv oplevelse.',
            ],
          },
        ],
      },
      {
        id: 'v133-fixes',
        title: 'Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixet et problem, hvor Realtime ikke blev opdateret korrekt, hvilket resulterede i, at der blev vist forældede data.',
              'Fixet et problem, hvor Session Replay nogle gange ikke gemte optagede sessioner.',
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
      title: 'Fejlrettelser og UI-forbedringer',
      summary: 'En mindre opdatering denne gang! Vi har rettet nogle fejl og pudset brugerfladen.',
    },
    sections: [
      {
        id: 'v132-fixes',
        title: 'Rettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem, hvor dashboard-indstillinger så ud til at kunne redigeres af teammedlemmer uden administratorrettigheder.',
              'Rettet et problem, hvor søgning i filtre stoppede med at virke efter valg af flere værdier.',
            ],
          },
        ],
      },
      {
        id: 'v132-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: ['Diverse mindre UI-forbedringer for en mere poleret oplevelse.'],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.1',
      releasedAt: '2026-01-11',
      title: 'Teamsamarbejde og styrket sikkerhed',
      summary:
        'Inviter teammedlemmer til at samarbejde på dine dashboards med rollebaseret adgang. Denne opdatering styrker også kontosikkerheden, forbedrer privatlivsisoleringen og gør det muligt at ændre dit dashboard-domæne.',
    },
    sections: [
      {
        id: 'v131-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Inviter teammedlemmer til dit dashboard som Tilskuer, Redaktør eller Administrator med rollebaserede rettigheder til sikkert samarbejde.',
              'Filtre understøtter nu OR-logik, så du kan matche flere værdier i ét filter (f.eks. flere sider eller lande).',
              'Du kan nu ændre dit dashboard-domæne under indstillinger. Dit Site ID og tracking-script forbliver uændret, så ingen kodeopdateringer er nødvendige.',
            ],
          },
        ],
      },
      {
        id: 'v131-security',
        title: 'Sikkerhed',
        blocks: [
          {
            type: 'list',
            items: [
              'Ændring af din adgangskode logger nu alle andre aktive sessioner ud.',
              'Nulstilling af adgangskode logger nu alle eksisterende sessioner ud for ekstra beskyttelse.',
            ],
          },
        ],
      },
      {
        id: 'v131-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'Forbedret privatlivsbeskyttelse til bedre at adskille besøgsdata mellem websites.',
              'Rettet layout-problemer i uptime-overvågningslisten på større skærme.',
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
      title: 'Uptime- & SSL-overvågning, klarere User Journeys',
      summary:
        'Betterlytics hjælper dig nu med at overvåge oppetid og SSL-sikkerhed for dine websites med notifikationer ved nedetid og udløb. Denne release gør også User Journeys nemmere at udforske og forbedrer nøjagtigheden på tværs af analyser.',
    },
    sections: [
      {
        id: 'v130-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Uptime-overvågning er nu tilgængelig. Følg oppetid, svartider og hændelser for dine websites, og få besked når noget går galt.',
              'SSL-certifikat-overvågning er inkluderet i uptime-overvågning, så du får advarsler før certifikater udløber eller bliver ugyldige.',
              'User Journey-stier kan nu låses i Sankey-diagrammet, hvilket gør det nemmere at følge og analysere specifikke brugerflows i komplekse journeys.',
            ],
          },
        ],
      },
      {
        id: 'v130-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey Sankey-diagrammer er yderligere visuelt forfinet for at reducere støj og gøre flows nemmere at følge.',
              'Ved oprettelse af funnels foreslås nu et mere komplet sæt filterværdier, så du hurtigere kan opbygge præcise funnels.',
              'Browser- og enhedsrapportering er forbedret med flere genkendelige ikoner.',
              'Prissiden indeholder nu en tydeligere plansammenligning, som gør det nemmere at se forskelle mellem abonnementer.',
            ],
          },
        ],
      },
      {
        id: 'v130-fixes',
        title: 'Rettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem hvor visse kampagnemetrikker var fejlmærket.',
              'Forbedret scroll-adfærd og ydeevne i events-tabellen.',
            ],
          },
        ],
      },
      {
        id: 'v130-maintenance',
        title: 'Vedligeholdelse',
        blocks: [
          {
            type: 'list',
            items: [
              'Generelle sikkerheds- og afhængighedsopdateringer for at holde Betterlytics stabil og sikker.',
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
      title: 'Gemte filtre, hostname-filtrering og forbedringer af User Journey',
      summary:
        'Gem dine foretrukne filterkombinationer for hurtig adgang, filtrer analyser efter hostname til multi-subdomæne-opsætninger, og User Journey får de sidste finpudsninger for mere flydende store diagrammer.',
    },
    sections: [
      {
        id: 'v129-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Du kan nu gemme filterkombinationer og hurtigt anvende dem senere – perfekt til ofte brugte visninger eller komplekse filteropsætninger.',
              'Hostname-filtrering er her! Hvis du har flere subdomæner, der peger på samme dashboard, kan du nu filtrere dine analyser efter hostname for at se data for specifikke subdomæner.',
            ],
          },
        ],
      },
      {
        id: 'v129-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey har fået de sidste finpudsninger. Store diagrammer er nu mere jævne og nemmere at følge.',
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
      title: 'Redesignet User Journey, kloning af funnels og forbedret platformstabilitet',
      summary:
        'User Journey har fået et komplet visuelt løft, funnels kan nu klones, og forbedringer i stabilitet og datanøjagtighed giver en bedre brugeroplevelse.',
    },
    sections: [
      {
        id: 'v128-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Visualiseringen af User Journey er blevet redesignet med en moderne brugerflade, der gør det nemmere at forstå, hvordan besøgende navigerer på dit website.',
              'Du kan nu klone eksisterende funnels for hurtigt at oprette variationer eller teste forskellige konfigurationer uden at starte forfra.',
            ],
          },
        ],
      },
      {
        id: 'v128-security',
        title: 'Sikkerhed',
        blocks: [
          {
            type: 'list',
            items: [
              'Next.js og React er blevet opdateret for at rette nyligt offentliggjorte sikkerhedssårbarheder og sikre dine data og konti.',
            ],
          },
        ],
      },
      {
        id: 'v128-improvements-and-fixes',
        title: 'Forbedringer & rettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Datanøjagtigheden i User Journey er forbedret for at give mere pålidelige indsigter i besøgendes adfærd.',
              'Farverne på verdenskortet og det ugentlige heatmap er opdateret for tydeligere at fremhæve forskelle i besøgsantal.',
              'Rettet et problem, hvor ændring af adgangskode ikke virkede for konti, der logger ind med e-mail og adgangskode.',
              'Ændringer i indstillinger kræver nu, at der klikkes på "Gem", før de træder i kraft, for at forhindre utilsigtede ændringer.',
              'Rettet en fejl, hvor tooltips for sammenligningsperioder viste forkerte datoer.',
              'Løst et problem, hvor diagramannotationer kunne forhindre diagrammer i at blive vist korrekt.',
              'Introduceret et nyt /event tracking-endpoint med tydeligere semantik og et navn, der bedre afspejler vores privacy-first arkitektur. Eksisterende /track-integrationer fungerer fortsat uden ændringer.',
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
      title: 'Diagramannoteringer, kampagne-fokuseret visning og sikkerhedsstyrkelse',
      summary:
        'Kampagnesiden fokuserer nu på navngivne UTM-kampagner, hoveddiagrammer understøtter annotationer, autentificering er styrket, og flere pålidelighedsrettelser forbedrer nøjagtighed og sikkerhed.',
    },
    sections: [
      {
        id: 'v127-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Kampagnesiden er fuldstændig genopbygget med fokus på navngivne UTM-kampagner, hvilket giver tydeligere og mere meningsfuld indsigt end den tidligere aggregerede visning.',
              'Du kan nu tilføje annotationer til hoveddiagrammer for at fremhæve vigtige begivenheder, udgivelser eller trafikændringer.',
              'Sletning af et dashboard inkluderer nu en kort sikkerhedsnedtælling for at forhindre utilsigtet fjernelse.',
            ],
          },
        ],
      },
      {
        id: 'v127-security-auth',
        title: 'Sikkerhed & Autentificering',
        blocks: [
          {
            type: 'list',
            items: [
              'Autentificering er styrket, hvilket forbedrer sessionernes integritet og beskyttelse.',
              'Patchet den seneste React Server Components-sårbarhed (CVE-2025-66478) ved at opdatere til den seneste sikre Next.js-udgivelse.',
            ],
          },
        ],
      },
      {
        id: 'v127-improvements-and-fixes',
        title: 'Forbedringer & Rettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Fikset en race condition, der kunne oprette dublerede abonnementer, når nye konti blev oprettet.',
              'Korrigerede side-per-session-beregninger i Pages-visningen, så metrikkerne nu nøjagtigt afspejler faktisk brug.',
              'Kontoverificering giver nu klarere feedback under verifikationsprocessen.',
              'Changelog-popup-layoutet er nu optimeret til små skærme, hvilket forbedrer læsbarheden på mobile enheder.',
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
      title: 'Redesignet Funnels og Smartere Kort',
      summary:
        'Funnels er fuldt redesignet med bedre visualiseringer. Verdenskortet understøtter nu sammenligninger og har forbedrede tooltips. Denne udgivelse inkluderer også fejlrettelser og opdaterede oversættelser.',
    },
    sections: [
      {
        id: 'v126-new-features',
        title: 'Nye Funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Funnels-siden har et helt nyt, visuelt layout, der er lettere at bruge og forstå.',
              'Verdenskortet understøtter nu sammenligninger mellem forskellige perioder.',
              'Tooltips på verdenskortet giver nu klarere indsigt og bedre ydeevne.',
            ],
          },
        ],
      },
      {
        id: 'v126-enhancements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: ['Manglende oversættelser er tilføjet, så brugere verden over får en mere ensartet oplevelse.'],
          },
        ],
      },
      {
        id: 'v126-bug-fixes',
        title: 'Fejlrettelser',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettede dublerede notifikationer ved overskridelse af planbegrænsninger.',
              'Rettede indlæsningsproblemer ved valg af fremtidige datointervaller.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.5',
      releasedAt: '2025-11-24',
      title: 'Mere præcis data og mere kontrol',
      summary:
        'Forbedret dataintegritet, strammere kontrol over indgående trafik og en række stabilitetsforbedringer.',
    },
    sections: [
      {
        id: 'v125-new-features',
        title: 'Nye funktioner',
        blocks: [
          {
            type: 'list',
            items: [
              'Sammenlign perioder direkte i verdenskort-visualiseringen.',
              'Bloker events fra specifikke IP-adresser for at undgå skæve eller uønskede besøg (fx dine egne).',
              'Afvis automatisk events fra domæner, der ikke matcher dit dashboard-domæne.',
            ],
          },
        ],
      },
      {
        id: 'v125-enhancements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'Core Web Vitals-labels er gjort klarere og mere forståelige.',
              'Antarktis skjules fra verdenskortet, medmindre der er besøgsdata.',
              'Tilføjet en "Rapportér en bug"-knap direkte i appen.',
              'Favicons er blevet tilføjet til dashboards.',
            ],
          },
        ],
      },
      {
        id: 'v125-bug-fixes',
        title: 'Bugfixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fikset et problem, der kunne forhindre Core Web Vitals-siden i at loade.',
              'Løst sommertid-problemer, der påvirkede viste analyser.',
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
      title: 'Live Demo Workspace & Opdateret Landing Page',
      summary:
        'Denne opdatering introducerer et nyt live demo workspace, en redesignet landing page og forbedret intern performance-monitorering for hurtigere og mere stabile dashboards.',
    },
    sections: [
      {
        id: 'v124-live-demo-workspace',
        title: 'Live Demo Workspace',
        blocks: [
          {
            type: 'text',
            body: 'Du kan nu udforske Betterlytics via et fuldt interaktivt demo workspace.',
          },
          {
            type: 'list',
            items: [
              'Gennemse dashboards, funnels og tabeller med præ-udfyldte eksempeldata',
              'Test filtre, opdelinger og sammenligninger uden at røre produktionsdata',
              'Del demoen med kolleger for at vise platformens muligheder',
            ],
          },
        ],
      },
      {
        id: 'v124-redesigned-landing-page',
        title: 'Redesignet Landing Page',
        blocks: [
          {
            type: 'text',
            body: 'Den offentlige hjemmeside er opdateret med klarere budskaber, nye visuals og forbedret navigation, så besøgende nemmere kan forstå, hvad Betterlytics tilbyder.',
          },
          {
            type: 'list',
            items: [
              'Opdateret tekst, der fremhæver kernemuligheder som analytics, funnels og session replay',
              'Nye screenshots, der afspejler produktet korrekt, også på mobil',
            ],
          },
        ],
      },
      {
        id: 'v124-performance-monitoring',
        title: 'Forbedret Performance-Monitorering',
        blocks: [
          {
            type: 'text',
            body: 'Platformens interne performance-telemetri er blevet styrket for hurtigere at opdage problemer og holde dashboards responsive.',
          },
          {
            type: 'list',
            items: [
              'Hurtigere identifikation af problemer, der påvirker forespørgsler eller loading-tid',
              'Mere indsigt i miljøadfærd for en mere stabil oplevelse',
              'Et stærkere fundament for løbende performance-forbedringer',
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
      title: 'Smartere Søgning, Klarere Filtre & Stabilitetsforbedringer',
      summary:
        'Denne opdatering introducerer forbedret søgning og filtrering, mere informative visualiseringer, bedre session replay og flere stabilitets- og UX-forbedringer.',
    },
    sections: [
      {
        id: 'v123-search-filters',
        title: 'Forbedret Søgning & Filtre',
        blocks: [
          {
            type: 'text',
            body: 'Søgning og filtrering skalerer nu bedre med store datasæt, hvilket gør det nemmere at finde den information, du har brug for.',
          },
          {
            type: 'list',
            items: [
              'Rige søgefunktioner til hurtigt at finde vigtige events, sider og egenskaber',
              'Mere responsive oversigtstabeller med passende begrænsninger for store workspaces',
              'Filtre gemmes i URL’en, så filtrerede visninger nemt kan bogmærkes og deles',
              'Rettelser til filtervalg og hierarkiske tabeller for mere pålidelige opdelinger',
            ],
          },
        ],
      },
      {
        id: 'v123-visual-context',
        title: 'Mere Kontekst i Visualiseringer',
        blocks: [
          {
            type: 'text',
            body: 'Flere visuelle komponenter viser nu ekstra detaljer, så du kan tolke trends hurtigere og med færre klik.',
          },
          {
            type: 'list',
            items: [
              'Udvidelige enhedsdetaljer med specifikke browsere og platforme',
              'Ugentlige heatmaps med hover-værktøjstip, der viser præcise tal og tidspunkter',
              '"Ingen ændring"-resuméer, der tydeligt fremhæver stabile sammenligningsperioder',
            ],
          },
        ],
      },
      {
        id: 'v123-session-replay',
        title: 'Forbedringer af Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'Session replays er nu mere pålidelige og præcise, så du trygt kan gennemgå brugerinteraktioner uden at misse vigtige handlinger.',
          },
          {
            type: 'list',
            items: [
              'Mere pålidelige og nøjagtige optagelser af brugerinteraktioner',
              'Forbedret afspilning af sessioner, så vigtige handlinger fanges korrekt',
            ],
          },
        ],
      },
      {
        id: 'v123-timezone-alignment',
        title: 'Tidszonejustering af Dashboards',
        blocks: [
          {
            type: 'text',
            body: 'Dashboards viser nu hver brugers lokale tid for mere intuitiv rapportering.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.2',
      releasedAt: '2025-10-20',
      title: 'Privatlivsfokuseret Session Replay & Hurtigere Dashboards',
      summary:
        'Denne opdatering introducerer anonymiseret session replay, forbedret ydeevne på dashboards og opdaterede oversættelser for en bedre global oplevelse.',
    },
    sections: [
      {
        id: 'v122-session-replay',
        title: 'Privatlivsfokuseret Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'Session replay er nu tilgængelig og viser anonymiserede optagelser af, hvordan besøgende interagerer med dit site. Følsomme oplysninger som tekst, formularfelter og billeder maskeres automatisk for at beskytte brugerens privatliv.',
          },
          {
            type: 'list',
            items: [
              'Se, hvor brugerne tøver, scroller eller forlader siden',
              'Identificer frustrationer som rage clicks',
              'Del optagelser med dit team uden at eksponere personlige data',
            ],
          },
        ],
      },
      {
        id: 'v122-faster-dashboards',
        title: 'Hurtigere og Smidigere Dashboards',
        blocks: [
          {
            type: 'text',
            body: 'Vi har reduceret unødvendige gen-renderinger i kernesiderne, så dashboards føles hurtigere, især i større workspaces. Navigering mellem rapporter og brug af filtre er nu mere responsivt.',
          },
        ],
      },
      {
        id: 'v122-translation-improvements',
        title: 'Forbedrede Oversættelser',
        blocks: [
          {
            type: 'text',
            body: 'Manglende oversættelser og inkonsekvent tekst er blevet opdateret, hvilket giver en mere poleret og ensartet oplevelse for internationale teams.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.1',
      releasedAt: '2025-09-22',
      title: 'Smartere Tidsintervaller & Mere Præcise Oversigtsmålinger',
      summary:
        'Denne opdatering tilføjer flere tids- og sammenligningsmuligheder, retter inkonsekvenser i oversigtsmålinger og forbedrer tilgængelighed samt mobilbrugervenlighed.',
    },
    sections: [
      {
        id: 'v121-time-comparison',
        title: 'Smartere Tids- & Sammenligningsintervaller',
        blocks: [
          {
            type: 'text',
            body: 'Tidsintervaller tilbyder nu flere forudindstillede muligheder og tydeligere sammenligningsvalg, så du kan besvare almindelige rapporteringsspørgsmål hurtigere.',
          },
          {
            type: 'list',
            items: [
              'Skift hurtigt til intervaller som sidste 24 timer, sidste 7 dage, sidste 14 dage eller sidste kvartal',
              'Sammenlign ydeevne med foregående periode eller sidste år, med mulighed for at justere ugedage for renere sammenligninger',
              'Tids- og sammenligningsvælgere er nu separate for bedre klarhed og kontrol',
            ],
          },
        ],
      },
      {
        id: 'v121-overview-metrics',
        title: 'Mere Præcise Oversigtsmålinger',
        blocks: [
          {
            type: 'text',
            body: 'Flere forbedringer sikrer mere pålidelige rapporter på oversigtssiden.',
          },
          {
            type: 'list',
            items: [
              'Summary-kort viser nu værdier fuldt synkroniseret med underliggende diagrammer og tabeller',
              'Pageview-tælling er blevet forbedret, så inaktive faner i baggrunden ikke længere øger totalsummen',
            ],
          },
        ],
      },
      {
        id: 'v121-accessibility',
        title: 'Forbedret Tilgængelighed & Mobilbrugervenlighed',
        blocks: [
          {
            type: 'text',
            body: 'Vi har fortsat med at forbedre den samlede brugervenlighed i Betterlytics, især for login og for teams på mindre skærme.',
          },
          {
            type: 'list',
            items: [
              'Login-formularer fungerer nu bedre med tastaturnavigation og hjælpemidler',
              'Mobil-layouts er forbedret, så dashboards og kontroller er lettere at bruge på små skærme',
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
      title: 'Ugentligt Heatmap, Nyt UI & Core Web Vitals',
      summary:
        'Denne opdatering introducerer en komplet redesign af Betterlytics-websitet, et ugentligt engagement-heatmap, opdaterede oversigtsmålinger, guidet onboarding for nye workspaces og Core Web Vitals baseret på rigtige brugere.',
    },
    sections: [
      {
        id: 'v120-redesign',
        title: 'Komplet Website- & Dashboard-Redesign',
        blocks: [
          {
            type: 'text',
            body: 'Hele websitet og alle dashboards er blevet opdateret med et nyt visuelt tema, ensartede farver, konsekvent typografi og forbedret layout. Navigation, tabeller, diagrammer, dialoger og værktøjstip er blevet finjusteret for en renere og mere intuitiv oplevelse på både desktop og mobil.',
          },
        ],
      },
      {
        id: 'v120-weekly-heatmap',
        title: 'Ugentligt Engagement-Heatmap',
        blocks: [
          {
            type: 'text',
            body: 'Oversigtssiden inkluderer nu et ugentligt heatmap, der viser trafikmønstre efter dag og time. Spot hurtigt spidsperioder, stille timer og usædvanlige aktivitetstoppe.',
          },
        ],
      },
      {
        id: 'v120-overview-context',
        title: 'Mere Kontekst i Oversigtsdiagrammer',
        blocks: [
          {
            type: 'text',
            body: 'To nye målekort er blevet tilføjet til oversigtsdiagrammet: samlet sessionsantal og gennemsnitlig besøgsvarighed. Det gør det nemmere at koble højniveau trafiktrends med, hvor længe folk faktisk bliver på dit site.',
          },
        ],
      },
      {
        id: 'v120-sparkline-trends',
        title: 'Mere Detaljerede Sparkline-Trends',
        blocks: [
          {
            type: 'text',
            body: 'Sparkline-grafik i oversigtskortene understøtter nu mere finmasket tidsintervaller, hvilket giver et klarere overblik over, hvordan målinger bevæger sig inden for det valgte interval. Korte udsving og fald er lettere at spotte uden at åbne en fuld rapport.',
          },
        ],
      },
      {
        id: 'v120-guided-onboarding',
        title: 'Guidet Onboarding for Nye Brugere',
        blocks: [
          {
            type: 'text',
            body: 'Nye konti får nu en trin-for-trin onboarding, der dækker tilføjelse af tracking-scriptet og udforskning af kernedashboards, hvilket gør opsætning hurtigere og mere overskuelig.',
          },
        ],
      },
      {
        id: 'v120-core-web-vitals',
        title: 'Core Web Vitals fra Rigtige Brugere',
        blocks: [
          {
            type: 'text',
            body: 'Betterlytics indsamler nu Core Web Vitals direkte fra rigtige besøgs-sessioner, hvilket giver et nøjagtigt billede af site-performance. Brug disse målinger til at opdage og rette regressionsproblemer, før de påvirker konverteringer.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.1',
      releasedAt: '2025-08-24',
      title: 'Sporing af Udgående Links, Hurtigere Tidsintervaller & Italiensk Lokalisation',
      summary:
        'Du kan nu spore klik på udgående links, bruge nye hurtige tidsintervaller til hurtigere analyse og få adgang til Betterlytics på italiensk.',
    },
    sections: [
      {
        id: 'v111-outbound-links',
        title: 'Sporing af Udgående Links',
        blocks: [
          {
            type: 'text',
            body: 'Udgående link-sporing er nu tilgængelig og viser, hvilke eksterne destinationer der får mest engagement. Dette hjælper dig med at måle, hvordan CTA’er mod partnere, dokumentation eller andre eksterne sider præsterer.',
          },
        ],
      },
      {
        id: 'v111-time-range-shortcuts',
        title: 'Hurtigere Tidsintervalgenveje',
        blocks: [
          {
            type: 'text',
            body: 'Tidsvælgeren indeholder nu flere hurtige muligheder og mere detaljerede intervaller, så du nemt kan hoppe til almindelige rapporteringsvinduer eller zoome ind på trends uden manuel datovalg.',
          },
        ],
      },
      {
        id: 'v111-italian-localization',
        title: 'Italiensk Lokalisation',
        blocks: [
          {
            type: 'text',
            body: 'Dashboardet er nu tilgængeligt på italiensk, hvilket giver en mere naturlig oplevelse for italiensktalende teams i navigation, rapporter og indstillinger.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.0',
      releasedAt: '2025-08-15',
      title: 'Lokaliserede Dashboards, Smartere Kort & Flere Sammenligninger',
      summary:
        'Dashboards er nu tilgængelige på flere sprog, verdenskortet er lettere at udforske, og sammenligningsværdier vises i flere diagrammer og fremdriftsindikatorer.',
    },
    sections: [
      {
        id: 'v110-dashboard-localization',
        title: 'Dashboard Lokalisering',
        blocks: [
          {
            type: 'text',
            body: 'Alle hovedsider i dashboardet er nu lokaliserede, så teams kan navigere, læse etiketter og se metrics på deres foretrukne sprog.',
          },
        ],
      },
      {
        id: 'v110-world-map',
        title: 'Forbedrede Verdenskort-Interaktioner',
        blocks: [
          {
            type: 'text',
            body: 'Verdenskortet er blevet forbedret, så regioner er lettere at holde musen over, vælge og sammenligne. Mindre eller tæt pakkede områder reagerer nu mere jævnt, og regionale grupperinger er tydeligere ved første blik.',
          },
        ],
      },
      {
        id: 'v110-comparison-values',
        title: 'Udvidede Sammenligningsværdier',
        blocks: [
          {
            type: 'text',
            body: 'Flere diagrammer og fremdriftsbjælker inkluderer nu hover-værktøjer med sammenligningsværdier, så det er nemmere at se, hvordan den aktuelle performance står i forhold til baseline uden at skifte visning.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.2',
      releasedAt: '2025-08-13',
      title: 'Rydigere Verdenskort & Mere Præcis Eventsporing',
      summary:
        'Denne opdatering forbedrer læsbarheden af verdenskortet og introducerer smartere URL-normalisering for mere præcis event-rapportering.',
    },
    sections: [
      {
        id: 'v102-world-map',
        title: 'Forbedringer af Verdenskort',
        blocks: [
          {
            type: 'text',
            body: 'Verdenskortet er opdateret med klarere visuelle elementer og landeflag, hvilket gør det lettere at overskue og forstå, hvor trafikken kommer fra. Kontrast og ikonografi er forbedret for bedre læsbarhed.',
          },
        ],
      },
      {
        id: 'v102-cleaner-urls',
        title: 'Rydigere Event-URLs',
        blocks: [
          {
            type: 'text',
            body: 'Event-URLs normaliseres nu automatisk, så variationer som trailing slashes eller "www" fjernes, og lignende trafik grupperes korrekt for mere konsekvent rapportering.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.1',
      releasedAt: '2025-08-11',
      title: 'Social Login, Funnels & Gravatar Avatars',
      summary:
        'Denne opdatering introducerer login med Google og GitHub, nye funnel-analyser til at spore frafald, og valgfri Gravatar-avatarer til arbejdsområder.',
    },
    sections: [
      {
        id: 'v101-social-login',
        title: 'Login med Google & GitHub',
        blocks: [
          {
            type: 'text',
            body: 'Brugere kan nu logge ind med Google eller GitHub for lettere onboarding og hurtigere oprettelse af konto.',
          },
        ],
      },
      {
        id: 'v101-funnels',
        title: 'Funnels til Frafaldsanalyse',
        blocks: [
          {
            type: 'text',
            body: 'Funnels er nu tilgængelige, så du kan visualisere, hvordan brugere bevæger sig gennem flertrinsrejser, og hvor de falder fra. Brug dette til at optimere tilmeldingsflows, onboarding og andre nøglekonverteringer.',
          },
        ],
      },
      {
        id: 'v101-gravatar',
        title: 'Gravatar Avatarer',
        blocks: [
          {
            type: 'text',
            body: 'Brugere kan nu aktivere Gravatar-baserede profilbilleder, hvilket giver simple og genkendelige avatarer uden behov for upload.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.0',
      releasedAt: '2025-08-01',
      title: 'Betterlytics 1.0 Lancering + To-Faktor Autentifikation',
      summary:
        'Den første stabile version af Betterlytics introducerer en pålidelig analysetjeneste samt valgfri to-faktor autentifikation (TOTP) for øget kontosikkerhed.',
    },
    sections: [
      {
        id: 'v100-launch',
        title: 'Betterlytics 1.0',
        blocks: [
          {
            type: 'text',
            body: 'Version 1.0 markerer den første stabile udgivelse af Betterlytics og samler kerneoplevelsen af dashboardet i et produkt klar til produktion for teams, der værdsætter privatlivsvenlig analyse.',
          },
        ],
      },
      {
        id: 'v100-totp',
        title: 'To-Faktor Autentifikation (TOTP)',
        blocks: [
          {
            type: 'text',
            body: 'Brugere kan nu aktivere tidsbaserede engangskoder (TOTP) for deres konti, hvilket giver et ekstra sikkerhedslag oven på adgangskoder. Enhver standard autentifikationsapp kan bruges.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v0.1.0',
      releasedAt: '2025-04-25',
      title: 'Tidlige Fundamenter for Betterlytics',
      summary:
        'Vi begyndte at bygge Betterlytics med fokus på privatlivsvenlig analyse, et intuitivt dashboard og en hurtig og pålidelig event-pipeline.',
    },
    sections: [
      {
        id: 'v010-project-kickoff',
        title: 'Projektstart',
        blocks: [
          {
            type: 'text',
            body: 'Udviklingen startede med en lille intern prototype, der kombinerede en event-pipeline, et tidligt dashboard og de første charting-eksperimenter. Fra dag ét var målet at gøre produkt- og marketinganalyse pålidelig, handlingsorienteret og GDPR-kompatibel.',
          },
        ],
      },
      {
        id: 'v010-performance-architecture',
        title: 'Performance-Fokuseret Arkitektur',
        blocks: [
          {
            type: 'text',
            body: 'I modsætning til mange open-source analysetjenester bygget i JavaScript eller lignende sprog, prioriterede vi hastighed og skalerbarhed. Tidlige beslutninger inkluderede brug af Rust til effektiv beregning og ClickHouse til højtydende datalagring, hvilket sikrer, at platformen kan håndtere store datasæt uden at blive langsom.',
          },
        ],
      },
      {
        id: 'v010-foundations',
        title: 'Fundamenter, Ikke Funktioner',
        blocks: [
          {
            type: 'text',
            body: 'I denne pre-1.0-periode fokuserede vi på den underliggende arkitektur frem for offentlige funktioner: design af lagring, formning af datamodellen og optimering af forespørgselsydelse, inden vi åbnede adgang bredere.',
          },
        ],
      },
    ],
  },
] as const;
