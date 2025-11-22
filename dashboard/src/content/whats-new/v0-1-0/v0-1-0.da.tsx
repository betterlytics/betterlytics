import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v0.1.0',
  releasedAt: '2025-04-25',
  title: 'Tidlige Fundamenter for Betterlytics',
  summary:
    'Vi begyndte at bygge Betterlytics med fokus på privatlivsvenlig analyse, et intuitivt dashboard og en hurtig og pålidelig event-pipeline.',
};

export default function ReleaseV010ContentDA() {
  return (
    <>
      <section>
        <h2>Projektstart</h2>
        <p>
          Udviklingen startede med en lille intern prototype, der kombinerede en event-pipeline, et tidligt
          dashboard og de første charting-eksperimenter. Fra dag ét var målet at gøre produkt- og marketinganalyse
          pålidelig, handlingsorienteret og GDPR-kompatibel.
        </p>
      </section>

      <section>
        <h2>Performance-Fokuseret Arkitektur</h2>
        <p>
          I modsætning til mange open-source analysetjenester bygget i JavaScript eller lignende sprog,
          prioriterede vi hastighed og skalerbarhed. Tidlige beslutninger inkluderede brug af Rust til effektiv
          beregning og ClickHouse til højtydende datalagring, hvilket sikrer, at platformen kan håndtere store
          datasæt uden at blive langsom.
        </p>
      </section>

      <section>
        <h2>Fundamenter, Ikke Funktioner</h2>
        <p>
          I denne pre-1.0-periode fokuserede vi på den underliggende arkitektur frem for offentlige funktioner:
          design af lagring, formning af datamodellen og optimering af forespørgselsydelse, inden vi åbnede adgang
          bredere.
        </p>
      </section>
    </>
  );
}
