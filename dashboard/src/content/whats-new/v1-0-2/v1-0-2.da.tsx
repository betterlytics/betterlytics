import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.2',
  releasedAt: '2025-08-13',
  title: 'Rydigere Verdenskort & Mere Præcis Eventsporing',
  summary:
    'Denne opdatering forbedrer læsbarheden af verdenskortet og introducerer smartere URL-normalisering for mere præcis event-rapportering.',
};

export default function ReleaseV102ContentDA() {
  return (
    <>
      <section>
        <h2>Forbedringer af Verdenskort</h2>
        <p>
          Verdenskortet er opdateret med klarere visuelle elementer og landeflag, hvilket gør det lettere at
          overskue og forstå, hvor trafikken kommer fra. Kontrast og ikonografi er forbedret for bedre læsbarhed.
        </p>
      </section>

      <section>
        <h2>Rydigere Event-URLs</h2>
        <p>
          Event-URLs normaliseres nu automatisk, så variationer som trailing slashes eller "www" fjernes, og
          lignende trafik grupperes korrekt for mere konsekvent rapportering.
        </p>
      </section>
    </>
  );
}
