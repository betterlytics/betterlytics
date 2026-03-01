import type { ChangelogEntryData } from '@/entities/system/changelog.entities';

export const latestChangelogModalNb: ChangelogEntryData = {
  metadata: {
    version: 'v1.3.6',
    releasedAt: '2026-02-28',
    title: 'Varslingsintegrasjoner for oppetidsvarsler og norsk lokalisering',
    summary:
      'Oppetidsvarsler kan nå leveres til Slack, Discord, Teams, Pushover eller et valgfritt webhook. Dashbordet er også nå tilgjengelig på norsk, og flere stabilitetsrettinger forbedrer påliteligheten på tvers av plattformen.',
  },
  sections: [
    {
      id: 'v136-new-features',
      title: 'Nye funksjoner',
      blocks: [
        {
          type: 'list',
          items: [
            'Oppetidsvarsler kan nå sendes til Slack, Discord, Microsoft Teams, Pushover eller et valgfritt webhook-endepunkt. Konfigurer varslingskanaler fra Integrasjoner-siden i dashbordinnstillingene.',
          ],
        },
      ],
    },
    {
      id: 'v136-improvements',
      title: 'Forbedringer',
      blocks: [
        {
          type: 'list',
          items: [
            'Dashbordet er nå tilgjengelig på norsk.',
            'Løste et problem på serversiden som under visse betingelser kunne forårsake ustabilitet, noe som forbedrer den overordnede plattformstabiliteten.',
          ],
        },
      ],
    },
    {
      id: 'v136-security',
      title: 'Sikkerhet',
      blocks: [
        {
          type: 'list',
          items: [
            'Oppgraderte kjerneavhengigheter for å adressere en nylig offentliggjort sikkerhetssårbarhet, slik at dataene og kontoene dine forblir sikre.',
          ],
        },
      ],
    },
    {
      id: 'v136-fixes',
      title: 'Feilrettinger',
      blocks: [
        {
          type: 'list',
          items: [
            'Rettet et problem der sektordiagrammer kunne ødelegge dashbordoppsettet på visse visninger.',
            'Rettet en feil der tidssonen kunne falle tilbake til en feil standardverdi.',
            'Rettet et problem der tilbakestillingsdagen for brukskvoten kunne vises som et negativt tall.',
          ],
        },
      ],
    },
  ],
};

export const changelogEntriesNb: readonly ChangelogEntryData[] = [
  {
    metadata: {
      version: 'v1.3.6',
      releasedAt: '2026-02-28',
      title: 'Varslingsintegrasjoner for oppetidsvarsler og norsk lokalisering',
      summary:
        'Oppetidsvarsler kan nå leveres til Slack, Discord, Teams, Pushover eller et valgfritt webhook. Dashbordet er også nå tilgjengelig på norsk, og flere stabilitetsrettinger forbedrer påliteligheten på tvers av plattformen.',
    },
    sections: [
      {
        id: 'v136-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Oppetidsvarsler kan nå sendes til Slack, Discord, Microsoft Teams, Pushover eller et valgfritt webhook-endepunkt. Konfigurer varslingskanaler fra Integrasjoner-siden i dashbordinnstillingene.',
            ],
          },
        ],
      },
      {
        id: 'v136-improvements',
        title: 'Forbedringer',
        blocks: [
          {
            type: 'list',
            items: [
              'Dashbordet er nå tilgjengelig på norsk.',
              'Løste et problem på serversiden som under visse betingelser kunne forårsake ustabilitet, noe som forbedrer den overordnede plattformstabiliteten.',
            ],
          },
        ],
      },
      {
        id: 'v136-security',
        title: 'Sikkerhet',
        blocks: [
          {
            type: 'list',
            items: [
              'Oppgraderte kjerneavhengigheter for å adressere en nylig offentliggjort sikkerhetssårbarhet, slik at dataene og kontoene dine forblir sikre.',
            ],
          },
        ],
      },
      {
        id: 'v136-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem der sektordiagrammer kunne ødelegge dashbordoppsettet på visse visninger.',
              'Rettet et tilgjengelighetsproblem ved innlogging som påvirket tastaturnavigering og hjelpeteknologier.',
              'Rettet en feil der tidssonen kunne falle tilbake til en feil standardverdi.',
              'Rettet et problem der tilbakestillingsdagen for brukskvoten kunne vises som et negativt tall.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.5',
      releasedAt: '2026-02-19',
      title: 'Nøkkelordovervåking og visuelle forbedringer',
      summary:
        'Oppetidsovervåkning kan nå varsle når forventede nøkkelord mangler på sidene dine, og dashbordene føles smidigere med animerte målere, tall og andre visuelle detaljer.',
    },
    sections: [
      {
        id: 'v135-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Oppetidsovervåkning kan nå sjekke etter et forventet nøkkelord i sideresponsen, og varsle deg hvis kritisk innhold mangler — selv når siden fortsatt returnerer status 200.',
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
              'Core Web Vitals-score vises nå i en animert måler, som gjør det enklere å lese ytelse med et raskt blikk.',
              'Diagramverktøytips forklarer nå når en uke- eller månedsbøtte bare delvis dekkes av valgt tidsrom.',
              'Tall, lasteindikatorer og andre små visuelle detaljer er forbedret for en jevnere og mer gjennomført opplevelse i hele dashbordet.',
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
      title: 'E-postrapporter og ukentlige og månedlige innsikter',
      summary:
        'Motta planlagte e-postrapporter for dashbordene dine og utforsk trender med uke- og månedsgranularitet for lengre tidsrom.',
    },
    sections: [
      {
        id: 'v134-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Planlegg e-postrapporter med analysesammendrag for dashbordene dine direkte fra innstillinger.',
              'Lengre tidsrom støtter nå ukentlig og månedlig granularitet, noe som gjør det enklere å oppdage langsiktige trender.',
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
              'Hendelser for spordybdesporing er nå inkludert uten ekstra kostnad og teller ikke mot din månedlige brukskvote.',
              'Filtervelgeren viser nå hvor mange filtre som er aktivt brukt.',
              'Tabellceller viser nå sammenligningsdata tydeligere når én periode ikke har data.',
            ],
          },
        ],
      },
      {
        id: 'v134-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Løste et problem der sporingsskriptet kunne sende ugyldige data.',
              'Rettet et problem i datoberegning som kunne vise feil tidsrom.',
              'E-postverifisering trigges nå korrekt for OAuth-registreringer.',
              'Sammenligningsindikatorer viser nå riktige verdier når data er null eller uendret.',
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
      title: 'Spordybde og forbedret onboarding',
      summary:
        'Spor spordybde for å forstå engasjement og frafall, og kom raskere i gang med nye onboarding-guider for rammeverk.',
    },
    sections: [
      {
        id: 'v133-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Se hvor langt brukere skroller ned på sidene dine for bedre å forstå innholdsengasjement og skrolleadferd.',
              'Utvidede onboarding-guider med tydeligere, trinnvise installasjonsinstruksjoner for mange flere rammeverk.',
            ],
          },
        ],
      },
      {
        id: 'v133-improvements-and-ux',
        title: 'Forbedringer og UX',
        blocks: [
          {
            type: 'list',
            items: [
              'Sammenleggbar sidepanel: Kategorier i sidepanelet kan nå foldes sammen, slik at du får mer kontroll over navigasjonsområdet ditt.',
              'Forbedrede Core Web Vitals-indikatorer gjør det enklere å se når måltall går over til terskler for «Fair» eller «Poor».',
              'Tilbakestilling av brukskvote: Lagt til en tydelig etikett i brukssammendraget som viser når den månedlige kvoten nullstilles.',
              'UI-polering: Lagt til subtile animasjoner i hele appen for en jevnere og mer responsiv opplevelse.',
            ],
          },
        ],
      },
      {
        id: 'v133-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem der Realtime ikke oppdaterte riktig, noe som førte til at utdaterte data ble vist.',
              'Rettet et problem der Session Replay noen ganger ikke klarte å lagre innspilte økter.',
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
      title: 'Feilrettinger og UI-polering',
      summary: 'En mindre utgivelse denne gangen! Vi har fikset noen feil og pusset opp grensesnittet.',
    },
    sections: [
      {
        id: 'v132-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem der dashbordinnstillinger så redigerbare ut for teammedlemmer uten administratorrettigheter.',
              'Rettet et problem der søk i filtre sluttet å fungere etter at flere verdier ble valgt.',
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
            items: ['Ulike mindre UI-forbedringer for en mer gjennomført opplevelse.'],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.1',
      releasedAt: '2026-01-11',
      title: 'Teamsamarbeid og styrket sikkerhet',
      summary:
        'Inviter teammedlemmer til å samarbeide om dashbordene dine med rollebasert tilgang. Denne utgivelsen styrker også kontosikkerheten, forbedrer personvernisolasjon og legger til støtte for å endre dashborddomene.',
    },
    sections: [
      {
        id: 'v131-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Inviter teammedlemmer til dashbordet ditt som visningsbruker, redaktør eller administrator, med rollebaserte rettigheter for trygt samarbeid.',
              'Filtre støtter nå OR-logikk, slik at du kan matche flere verdier innenfor ett enkelt filter (for eksempel flere sider eller land).',
              'Du kan nå endre dashborddomenet ditt i innstillinger. Site ID og sporingsskript forblir uendret, så ingen kodeoppdateringer er nødvendige.',
            ],
          },
        ],
      },
      {
        id: 'v131-security',
        title: 'Sikkerhet',
        blocks: [
          {
            type: 'list',
            items: [
              'Endring av passord ugyldiggjør nå alle andre aktive økter.',
              'Tilbakestilling av passord logger nå ut alle eksisterende økter for ekstra beskyttelse.',
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
              'Forbedret personvern for å isolere besøksdata bedre mellom nettsteder.',
              'Rettet avstand i layouten i oppetidsovervåkningslisten på større skjermer.',
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
      title: 'Oppetids- og SSL-overvåking, tydeligere brukerreiser',
      summary:
        'Betterlytics hjelper deg nå med å overvåke nettstedets oppetid og SSL-status med varsler ved nedetid og utløp. Denne utgivelsen gjør også brukerreiser enklere å utforske og forbedrer nøyaktigheten på tvers av analysevisninger.',
    },
    sections: [
      {
        id: 'v130-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Overvåking av nettstedets oppetid er nå tilgjengelig. Spor oppetid, latenstid og hendelser for nettstedene dine, og få varsler når noe går galt.',
              'Overvåking av SSL-sertifikater er inkludert med oppetidsovervåking, slik at du varsles før sertifikater utløper eller blir ugyldige.',
              'Stier i brukerreiser kan nå låses i Sankey-diagrammet, noe som gjør det enklere å spore og følge spesifikke brukerflyter i komplekse reiser.',
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
              'Sankey-diagrammer for brukerreiser er ytterligere visuelt forbedret for å redusere støy og gjøre stier enklere å følge.',
              'Oppretting av trakter foreslår nå et mer komplett sett med filterverdier, som hjelper deg med å bygge nøyaktige trakter raskere.',
              'Rapportering for nettleser og enhet er forbedret med mer gjenkjennelige ikoner.',
              'Prissiden inneholder nå en tydeligere sammenligningstabell for planer, slik at forskjeller i funksjoner blir lettere å forstå.',
            ],
          },
        ],
      },
      {
        id: 'v130-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem der enkelte kampanjemåltall var feilmerket.',
              'Forbedret skrolleatferd og ytelse i hendelsestabellen.',
            ],
          },
        ],
      },
      {
        id: 'v130-maintenance',
        title: 'Vedlikehold',
        blocks: [
          {
            type: 'list',
            items: ['Generelle sikkerhets- og avhengighetsoppdateringer for å holde Betterlytics stabilt og sikkert.'],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.9',
      releasedAt: '2025-12-21',
      title: 'Lagrede filtre, vertsnavnfiltrering og forbedringer i brukerreiser',
      summary:
        'Lagre favorittfilterkombinasjonene dine for rask tilgang, filtrer analyse etter vertsnavn for oppsett med flere underdomener, og få siste finpuss i brukerreiser for smidigere store diagrammer.',
    },
    sections: [
      {
        id: 'v129-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Du kan nå lagre filterkombinasjoner og raskt bruke dem senere. Perfekt for ofte brukte visninger eller komplekse filteroppsett du vil bruke igjen.',
              'Vertsnavnfiltrering er her! Hvis du har flere underdomener som peker til samme dashbord, kan du nå filtrere analysen etter vertsnavn for å se data for spesifikke underdomener.',
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
              'Brukerreiser har fått noen siste forbedringer. Store diagrammer flyter nå smidigere og er enklere å følge med et raskt blikk.',
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
      title: 'Redesignet brukerreise, kloning av trakter og forbedret plattformstabilitet',
      summary:
        'Brukerreise får en komplett visuell oppfriskning, trakter kan nå klones, og forbedringer i stabilitet og nøyaktighet gir en bedre brukeropplevelse.',
    },
    sections: [
      {
        id: 'v128-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Visualiseringen av brukerreiser er redesignet med et friskt, moderne grensesnitt som gjør det enklere å forstå hvordan besøkende navigerer på nettstedet ditt.',
              'Du kan nå klone eksisterende trakter for raskt å lage varianter eller teste ulike konfigurasjoner uten å starte fra bunnen av.',
            ],
          },
        ],
      },
      {
        id: 'v128-security',
        title: 'Sikkerhet',
        blocks: [
          {
            type: 'list',
            items: [
              'Oppdaterte Next.js og React for å tette nylig offentliggjorte sikkerhetssårbarheter, slik at dataene og kontoene dine forblir sikre.',
            ],
          },
        ],
      },
      {
        id: 'v128-improvements-and-fixes',
        title: 'Forbedringer og feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Nøyaktigheten i data for brukerreiser er forbedret for mer pålitelige innsikter i besøksstier.',
              'Farger i geografikart og ukentlig varmekart er oppdatert for bedre å fremheve forskjeller i antall besøkende, slik at mønstre blir lettere å oppdage.',
              'Rettet et problem der passordendringer ikke fungerte for kontoer som logget inn med e-post og passord i stedet for sosiale innloggingsleverandører.',
              'Endringer i innstillinger krever nå at du klikker "Lagre" før de trer i kraft, for å unngå utilsiktede endringer.',
              'Rettet en feil der verktøytips for sammenligningsintervall viste feil datoer.',
              'Løste et problem der diagramannotasjoner kunne hindre diagrammer i å rendres riktig.',
              'Introduserte et nytt /event-endepunkt for sporing med tydeligere semantikk og bedre tilpasning til vår personvernfokuserte arkitektur. Eksisterende /track-integrasjoner fortsetter å fungere uten endringer.',
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
      title: 'Diagramannotasjoner, kampanje-først-visning og styrket sikkerhet',
      summary:
        'Kampanjesiden fokuserer nå på navngitte UTM-kampanjer, hoveddiagrammer støtter annotasjoner, autentisering er styrket, og flere stabilitetsrettinger forbedrer nøyaktighet og sikkerhet.',
    },
    sections: [
      {
        id: 'v127-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Kampanjesiden er bygget helt om for å fokusere på navngitte UTM-kampanjer, og gir tydeligere og mer meningsfulle innsikter enn den tidligere aggregerte visningen.',
              'Du kan nå legge til annotasjoner i hoveddiagrammer for å fremheve viktige hendelser, lanseringer eller trafikkendringer.',
              'Sletting av dashbord inkluderer nå en kort sikkerhetsnedtelling for å hindre utilsiktet fjerning.',
            ],
          },
        ],
      },
      {
        id: 'v127-security-auth',
        title: 'Sikkerhet og autentisering',
        blocks: [
          {
            type: 'list',
            items: [
              'Autentisering er styrket, med bedre øktintegritet og beskyttelse.',
              'Tettet den nylige sårbarheten i React Server Components (CVE-2025-66478) ved å oppdatere til nyeste sikre Next.js-utgivelse.',
            ],
          },
        ],
      },
      {
        id: 'v127-improvements-and-fixes',
        title: 'Forbedringer og feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet en race condition som kunne opprette dupliserte abonnementer når nye kontoer ble opprettet.',
              'Korrigerte beregninger av sider per økt i Sider-visningen, slik at måltall nå gjenspeiler faktisk bruk mer nøyaktig.',
              'Kontoverifisering gir nå tydeligere tilbakemelding under verifiseringsprosessen.',
              'Oppsettet i popup-vinduet for endringslogg er nå optimalisert for små skjermer, som forbedrer lesbarheten på mobile enheter.',
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
      title: 'Redesignede trakter og smartere kart',
      summary:
        'Trakter er fullstendig redesignet med forbedrede visualiseringer. Interaksjoner i verdenskartet inkluderer nå sammenligningsfunksjoner og bedre verktøytips. Denne utgivelsen inkluderer også feilrettinger og oppdaterte oversettelser.',
    },
    sections: [
      {
        id: 'v126-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Traktsiden har fått en helt ny visuell layout som er enklere å bruke og forstå.',
              'Verdenskartet støtter nå periode-over-periode-sammenligninger.',
              'Verktøytips i verdenskartet viser nå tydeligere innsikt med forbedret ytelse.',
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
            items: ['La til manglende oversettelser slik at brukere over hele verden får en smidigere opplevelse.'],
          },
        ],
      },
      {
        id: 'v126-bug-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet dupliserte varsler ved overskridelse av plangrenser.',
              'Rettet lasteproblemer ved valg av fremtidige datointervaller.',
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
      title: 'Mer presise data, mer kontroll',
      summary: 'Forbedret dataintegritet, strengere kontroll av innkommende trafikk og en rekke stabilitetsrettinger.',
    },
    sections: [
      {
        id: 'v125-new-features',
        title: 'Nye funksjoner',
        blocks: [
          {
            type: 'list',
            items: [
              'Sammenlign data over valgte perioder direkte i visualiseringen av verdenskartet.',
              'Blokker hendelser fra spesifikke IP-adresser for å unngå skjev eller uønsket trafikk (f.eks. dine egne besøk).',
              'Avvis automatisk hendelser fra domener som ikke samsvarer med dashborddomenet ditt.',
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
              'Etiketter for Core Web Vitals er finjustert for tydeligere forståelse.',
              'Antarktis skjules fra verdenskartet med mindre det finnes besøksdata.',
              'La til en "Rapporter en feil"-knapp i appen for rask innsending av tilbakemeldinger.',
              'La til favikoner for dashborddomener.',
            ],
          },
        ],
      },
      {
        id: 'v125-bug-fixes',
        title: 'Feilrettinger',
        blocks: [
          {
            type: 'list',
            items: [
              'Rettet et problem som gjorde at siden for Core Web Vitals ikke lastet.',
              'Løste problemer med sommertid som påvirket vist analyse.',
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
      title: 'Live demo-arbeidsområde og oppfrisket landingsside',
      summary:
        'Denne oppdateringen introduserer et nytt live demo-arbeidsområde, en redesignet landingsside og forbedret intern ytelsesovervåking for å holde dashbord raske og pålitelige.',
    },
    sections: [
      {
        id: 'v124-live-demo-workspace',
        title: 'Live demo-arbeidsområde',
        blocks: [
          {
            type: 'text',
            body: 'Du kan nå utforske Betterlytics med et fullt interaktivt demo-arbeidsområde.',
          },
          {
            type: 'list',
            items: [
              'Utforsk dashbord, trakter og tabeller med forhåndsutfylte eksempeldata',
              'Test filtre, oppdelinger og sammenligninger uten å berøre produksjonsdata',
              'Del demoen med teammedlemmer for å forhåndsvise plattformens muligheter',
            ],
          },
        ],
      },
      {
        id: 'v124-redesigned-landing-page',
        title: 'Redesignet landingsside',
        blocks: [
          {
            type: 'text',
            body: 'Det offentlige nettstedet er oppdatert med tydeligere budskap, nye visuelle elementer og forbedret navigasjon for å hjelpe besøkende å forstå hva Betterlytics tilbyr.',
          },
          {
            type: 'list',
            items: [
              'Oppdatert tekst som fremhever kjernefunksjoner som analyse, trakter og session replay',
              'Nye skjermbilder som gjenspeiler dagens produkt i mobilvisning',
            ],
          },
        ],
      },
      {
        id: 'v124-performance-monitoring',
        title: 'Forbedret ytelsesovervåking',
        blocks: [
          {
            type: 'text',
            body: 'Vi har styrket plattformens interne ytelsestelemetri for å oppdage treghet tidligere og holde dashbord responsive.',
          },
          {
            type: 'list',
            items: [
              'Raskere identifisering av problemer som påvirker spørringstid eller lastehastighet',
              'Bedre innsikt i miljøatferd for en mer stabil opplevelse',
              'Et sterkere fundament for kontinuerlige ytelsesforbedringer',
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
      title: 'Smartere søk, tydeligere filtre og stabilitetsforbedringer',
      summary:
        'Denne oppdateringen introduserer forbedret søk og filtrering, mer informative visualiseringer, bedre kontroller for session replay og flere forbedringer i stabilitet og brukeropplevelse.',
    },
    sections: [
      {
        id: 'v123-search-filters',
        title: 'Forbedret søk og filtre',
        blocks: [
          {
            type: 'text',
            body: 'Søk og filtrering skalerer nå bedre med store datasett, noe som gjør det enklere å finne informasjonen du trenger.',
          },
          {
            type: 'list',
            items: [
              'Rikere søkealternativer for raskt å finne nøkkelhendelser, sider og egenskaper',
              'Mer responsive oversiktstabeller med fornuftige grenser for store arbeidsområder',
              'Filterinnstillinger gjenspeiles nå i URL-en, som gjør filtrerte visninger enkle å bokmerke og dele',
              'Rettelser i filtervalg og hierarkiske tabeller for mer pålitelige oppdelinger',
            ],
          },
        ],
      },
      {
        id: 'v123-visual-context',
        title: 'Mer kontekst i visualiseringer',
        blocks: [
          {
            type: 'text',
            body: 'Flere visuelle komponenter viser nå ekstra detaljer for å hjelpe deg med å tolke trender raskere og med færre klikk.',
          },
          {
            type: 'list',
            items: [
              'Utvidbare enhetsdetaljer som viser spesifikke nettlesere og plattformer',
              'Ukentlige varmekart med verktøytips ved hover for eksakte tellinger og tidspunkter',
              '"Ingen endring"-sammendrag som tydelig fremhever stabile sammenligningsperioder',
            ],
          },
        ],
      },
      {
        id: 'v123-session-replay',
        title: 'Forbedringer i Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'Session replay er nå mer pålitelig og nøyaktig, slik at du trygt kan gjennomgå brukerinteraksjoner uten å gå glipp av nøkkelhendelser eller møte inkonsistenser.',
          },
          {
            type: 'list',
            items: [
              'Mer pålitelige og nøyaktige opptak av brukerinteraksjoner',
              'Forbedret avspilling av økter slik at nøkkelhandlinger fanges korrekt',
            ],
          },
        ],
      },
      {
        id: 'v123-timezone-alignment',
        title: 'Tilpasning av dashbordtidssone',
        blocks: [
          {
            type: 'text',
            body: 'Dashbord gjenspeiler nå hver brukers lokale tid for mer intuitiv rapportering.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.2',
      releasedAt: '2025-10-20',
      title: 'Personvernfokusert Session Replay og raskere dashbord',
      summary:
        'Denne utgivelsen introduserer anonymisert session replay, ytelsesforbedringer på tvers av dashbord og oppdaterte oversettelser for en smidigere global opplevelse.',
    },
    sections: [
      {
        id: 'v122-session-replay',
        title: 'Personvernfokusert Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'Session replay er nå tilgjengelig, slik at du kan se anonymiserte opptak av hvordan besøkende samhandler med nettstedet ditt. Sensitiv informasjon, som tekst, skjemainndata og bilder, maskeres automatisk for å beskytte brukernes personvern.',
          },
          {
            type: 'list',
            items: [
              'Forstå hvor brukere nøler, skroller eller faller fra',
              'Identifiser frustrasjonssignaler som rage clicks',
              'Del avspillinger med teamet ditt uten å eksponere personopplysninger',
            ],
          },
        ],
      },
      {
        id: 'v122-faster-dashboards',
        title: 'Raskere og smidigere dashbord',
        blocks: [
          {
            type: 'text',
            body: 'Vi har redusert unødvendige re-renders i kjernevisninger, slik at dashbord føles raskere, spesielt i større arbeidsområder. Navigering mellom rapporter og bruk av filtre skal nå oppleves mer responsivt.',
          },
        ],
      },
      {
        id: 'v122-translation-improvements',
        title: 'Forbedrede oversettelser',
        blocks: [
          {
            type: 'text',
            body: 'Manglende oversettelser og inkonsekvente formuleringer er oppdatert, noe som gir en mer gjennomført opplevelse for internasjonale team.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.1',
      releasedAt: '2025-09-22',
      title: 'Smartere tidsrom og mer nøyaktige oversiktsmåltall',
      summary:
        'Denne utgivelsen legger til rikere tids- og sammenligningsintervaller, retter inkonsistenser i oversiktsmåltall og forbedrer tilgjengelighet og brukervennlighet på mobil.',
    },
    sections: [
      {
        id: 'v121-time-comparison',
        title: 'Smartere tids- og sammenligningsintervaller',
        blocks: [
          {
            type: 'text',
            body: 'Kontroller for tidsrom tilbyr nå flere forhåndsvalg og tydeligere sammenligningsvalg, som hjelper deg å svare raskere på vanlige rapporteringsspørsmål.',
          },
          {
            type: 'list',
            items: [
              'Bytt raskt til intervaller som siste 24 timer, siste 7 dager, siste 14 dager eller forrige kvartal',
              'Sammenlign ytelse med forrige periode eller i fjor, med mulighet for å justere ukedager for renere sammenligninger',
              'Velgerne for tid og sammenligning er nå separate for bedre tydelighet og kontroll',
            ],
          },
        ],
      },
      {
        id: 'v121-overview-metrics',
        title: 'Mer nøyaktige oversiktsmåltall',
        blocks: [
          {
            type: 'text',
            body: 'Flere nøyaktighetsforbedringer sikrer mer pålitelig rapportering på oversiktssiden.',
          },
          {
            type: 'list',
            items: [
              'Verdier i sammendragskort holder seg nå fullt synkronisert med underliggende diagrammer og tabeller',
              'Telling av sidevisninger er forbedret slik at inaktive bakgrunnsfaner ikke lenger blåser opp totaler',
            ],
          },
        ],
      },
      {
        id: 'v121-accessibility',
        title: 'Forbedret tilgjengelighet og mobil brukervennlighet',
        blocks: [
          {
            type: 'text',
            body: 'Vi har fortsatt å forbedre den generelle brukervennligheten i Betterlytics, særlig for innlogging og for team som jobber på mindre skjermer.',
          },
          {
            type: 'list',
            items: [
              'Innloggingsskjemaer fungerer nå smidigere med tastaturnavigering og hjelpeteknologier',
              'Mobiloppsett er forbedret for enklere samhandling med dashbord og kontroller på mindre skjermer',
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
      title: 'Ukentlig varmekart, full redesign av nettstedet og Core Web Vitals',
      summary:
        'Denne oppdateringen introduserer en full redesign av Betterlytics-nettstedet, et ukentlig engasjementsvarmekart, oppdaterte oversiktsmåltall, guidet onboarding for nye arbeidsområder og sporing av Core Web Vitals fra reelle brukere.',
    },
    sections: [
      {
        id: 'v120-redesign',
        title: 'Full redesign av nettsted og dashbord',
        blocks: [
          {
            type: 'text',
            body: 'Hele nettstedet og alle dashbord er oppdatert med et fornyet visuelt tema, samkjørte farger, konsistent typografi og forbedret layout. Navigasjon, tabeller, diagrammer, dialoger og verktøytips er finjustert for en renere og mer intuitiv opplevelse på både desktop og mobil.',
          },
        ],
      },
      {
        id: 'v120-weekly-heatmap',
        title: 'Ukentlig engasjementsvarmekart',
        blocks: [
          {
            type: 'text',
            body: 'Oversiktssiden inkluderer nå et ukentlig varmekart som viser trafikkmønstre per dag og time. Oppdag raskt toppperioder, rolige timer og uvanlige aktivitetsøkninger med et blikk.',
          },
        ],
      },
      {
        id: 'v120-overview-context',
        title: 'Mer kontekst i oversiktsdiagrammer',
        blocks: [
          {
            type: 'text',
            body: 'To nye måltallskort er lagt til i oversiktsdiagrammet: totalt antall økter og gjennomsnittlig besøksvarighet. Dette gjør det enklere å koble overordnede trafikktrender med hvor lenge folk faktisk blir på nettstedet ditt.',
          },
        ],
      },
      {
        id: 'v120-sparkline-trends',
        title: 'Mer detaljerte sparkline-trender',
        blocks: [
          {
            type: 'text',
            body: 'Sparklines i sammendragskort støtter nå mer finmaskede tidsbøtter, som gir deg en tydeligere visning av hvordan måltall beveger seg innenfor et valgt område. Korte topper og daler er enklere å oppdage uten å åpne en full rapport.',
          },
        ],
      },
      {
        id: 'v120-guided-onboarding',
        title: 'Guidet onboarding for nye brukere',
        blocks: [
          {
            type: 'text',
            body: 'Nye kontoer får nå en trinnvis onboardingflyt som dekker innlegging av sporingsskript og utforsking av kjerne-dashbord, noe som gjør oppsettet raskere og mer tilgjengelig.',
          },
        ],
      },
      {
        id: 'v120-core-web-vitals',
        title: 'Core Web Vitals fra reelle brukere',
        blocks: [
          {
            type: 'text',
            body: 'Betterlytics samler nå inn Core Web Vitals direkte fra reelle besøksøkter, som gir deg et presist bilde av ytelsen i praksis. Bruk disse måltallene for å identifisere og rette regresjoner før de påvirker konverteringer.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.1',
      releasedAt: '2025-08-24',
      title: 'Sporing av utgående lenker, raskere tidsrom og italiensk lokalisering',
      summary:
        'Du kan nå spore klikk på utgående lenker, bruke nye raske tidsromsalternativer for raskere analyse, og bruke Betterlytics på italiensk.',
    },
    sections: [
      {
        id: 'v111-outbound-links',
        title: 'Sporing av utgående lenker',
        blocks: [
          {
            type: 'text',
            body: 'Sporing av utgående lenker er nå tilgjengelig og viser hvilke eksterne destinasjoner som får mest engasjement. Dette hjelper deg med å måle effekten av CTA-er som leder til partnere, dokumentasjon eller andre eksterne nettsteder.',
          },
        ],
      },
      {
        id: 'v111-time-range-shortcuts',
        title: 'Raskere tidsromssnarveier',
        blocks: [
          {
            type: 'text',
            body: 'Tidsromsvelgeren inkluderer nå flere hurtigalternativer og granulære intervaller, som gjør det enklere å hoppe til vanlige rapporteringsvinduer eller zoome inn på trender uten manuell datovelging.',
          },
        ],
      },
      {
        id: 'v111-italian-localization',
        title: 'Italiensk lokalisering',
        blocks: [
          {
            type: 'text',
            body: 'Dashbordet er nå tilgjengelig på italiensk og gir en mer naturlig opplevelse for italiensktalende team på tvers av navigasjon, rapporter og innstillinger.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.0',
      releasedAt: '2025-08-15',
      title: 'Lokaliserte dashbord, smartere kart og rikere sammenligninger',
      summary:
        'Dashbord er nå tilgjengelige på flere språk, verdenskartet er mer intuitivt å utforske, og sammenligningsverdier vises i flere diagrammer og fremdriftsindikatorer.',
    },
    sections: [
      {
        id: 'v110-dashboard-localization',
        title: 'Dashbordlokalisering',
        blocks: [
          {
            type: 'text',
            body: 'Alle hovedsidene i dashbordet er nå lokalisert, slik at team kan bruke navigasjon, etiketter og måltall på sitt foretrukne språk.',
          },
        ],
      },
      {
        id: 'v110-world-map',
        title: 'Forbedrede interaksjoner i verdenskartet',
        blocks: [
          {
            type: 'text',
            body: 'Verdenskartet er forbedret for å gjøre regioner enklere å holde over, velge og sammenligne. Mindre og tettpakkede områder reagerer nå smidigere, og regionale grupperinger er tydeligere med et raskt blikk.',
          },
        ],
      },
      {
        id: 'v110-comparison-values',
        title: 'Utvidede sammenligningsverdier',
        blocks: [
          {
            type: 'text',
            body: 'Flere diagrammer og fremdriftslinjer inkluderer nå verktøytips ved hover med sammenligningsverdier, som gjør det enklere å se hvordan nåværende ytelse står seg mot grunnlinjen uten å bytte visning.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.2',
      releasedAt: '2025-08-13',
      title: 'Renere verdenskartdata og mer nøyaktig hendelsessporing',
      summary:
        'Denne oppdateringen forbedrer tydeligheten i verdenskartvisualiseringen og introduserer smartere URL-normalisering for mer nøyaktig hendelsesrapportering.',
    },
    sections: [
      {
        id: 'v102-world-map',
        title: 'Forbedringer i verdenskartet',
        blocks: [
          {
            type: 'text',
            body: 'Verdenskartet er oppdatert med tydeligere grafikk og landsflagg, noe som gjør det enklere å skanne og forstå hvor trafikken din kommer fra. Kontrast og ikonografi er forbedret for bedre lesbarhet.',
          },
        ],
      },
      {
        id: 'v102-cleaner-urls',
        title: 'Renere hendelses-URL-er',
        blocks: [
          {
            type: 'text',
            body: 'Hendelses-URL-er normaliseres nå automatisk ved å fjerne variasjoner som avsluttende skråstreker eller "www", slik at lignende trafikk grupperes riktig for mer konsistent rapportering.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.1',
      releasedAt: '2025-08-11',
      title: 'Sosial innlogging, trakter og Gravatar-avatarer',
      summary:
        'Denne oppdateringen introduserer innlogging med Google og GitHub, nye traktanalyser for å spore frafall og valgfrie Gravatar-baserte avatarer for arbeidsområder.',
    },
    sections: [
      {
        id: 'v101-social-login',
        title: 'Google- og GitHub-innlogging',
        blocks: [
          {
            type: 'text',
            body: 'Brukere kan nå logge inn med Google eller GitHub for enklere onboarding og en raskere registreringsprosess.',
          },
        ],
      },
      {
        id: 'v101-funnels',
        title: 'Trakter for frafallsanalyse',
        blocks: [
          {
            type: 'text',
            body: 'Trakter er nå tilgjengelige, slik at du kan visualisere hvordan brukere beveger seg gjennom flertrinnsreiser og hvor de faller fra. Bruk dette til å optimalisere registreringsflyter, onboarding og andre nøkkelkonverteringer.',
          },
        ],
      },
      {
        id: 'v101-gravatar',
        title: 'Gravatar-avatarer',
        blocks: [
          {
            type: 'text',
            body: 'Brukere kan nå aktivere Gravatar-baserte profilbilder, som gir enkle og gjenkjennelige avatarer uten behov for opplasting.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.0',
      releasedAt: '2025-08-01',
      title: 'Lansering av Betterlytics 1.0 + tofaktorautentisering',
      summary:
        'Den første stabile utgivelsen av Betterlytics introduserer en pålitelig analyseopplevelse sammen med valgfri tofaktorautentisering (TOTP) for styrket kontosikkerhet.',
    },
    sections: [
      {
        id: 'v100-launch',
        title: 'Betterlytics 1.0',
        blocks: [
          {
            type: 'text',
            body: 'Versjon 1.0 markerer den første stabile utgivelsen av Betterlytics, og samler kjerneopplevelsen i dashbordet til et produksjonsklart produkt for team som bryr seg om personvernvennlig analyse.',
          },
        ],
      },
      {
        id: 'v100-totp',
        title: 'Tofaktorautentisering (TOTP)',
        blocks: [
          {
            type: 'text',
            body: 'Brukere kan nå aktivere tidsbaserte engangspassord (TOTP) for kontoene sine, som legger til et ekstra sikkerhetslag i tillegg til passord. En hvilken som helst standard autentiseringsapp kan brukes.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v0.1.0',
      releasedAt: '2025-04-25',
      title: 'Tidlige grunnpilarer i Betterlytics',
      summary:
        'Vi begynte å bygge Betterlytics med fokus på personvernvennlig analyse, et intuitivt dashbord og en rask og pålitelig hendelsespipeline.',
    },
    sections: [
      {
        id: 'v010-project-kickoff',
        title: 'Prosjektoppstart',
        blocks: [
          {
            type: 'text',
            body: 'Utviklingen startet med en liten intern prototype som kombinerte en hendelsespipeline, et første dashbord og tidlige eksperimenter med diagrammer. Fra dag én var målet å gjøre produkt- og markedsanalyse pålitelig, handlingsrettet og personvernkompatibel (GDPR-klar).',
          },
        ],
      },
      {
        id: 'v010-performance-architecture',
        title: 'Ytelsesfokusert arkitektur',
        blocks: [
          {
            type: 'text',
            body: 'I motsetning til mange åpen kildekode-plattformer for analyse bygget i JavaScript eller lignende språk, prioriterte vi hastighet og skalerbarhet. Tidlige valg inkluderte bruk av Rust for effektiv beregning og ClickHouse for høyytelses datalagring, slik at plattformen kunne håndtere store datasett uten å bli treg.',
          },
        ],
      },
      {
        id: 'v010-foundations',
        title: 'Grunnmur, ikke funksjoner',
        blocks: [
          {
            type: 'text',
            body: 'I denne pre-1.0-perioden var fokuset å bygge den underliggende arkitekturen fremfor offentlige funksjoner: utforming av lagring, utvikling av datamodellen og forbedring av spørringsytelse før bredere tilgang ble åpnet.',
          },
        ],
      },
    ],
  },
] as const;
