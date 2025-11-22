import Image from 'next/image';
import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.4',
  releasedAt: '2025-10-05',
  title: 'Automationsværn og bedre debugging',
  summary:
    'Segmenterede alarmer, heatmaps for lange forespørgsler og en forbedret indtags-pipeline, der gør retroaktive datarettelser nemme.',
};

export default function ReleaseV124ContentDa() {
  return (
    <>
      <section>
        <h2>Automationsværn</h2>
        <p>
          Alarmer kan nu afgrænses til enkelte dashboards, trafikkilder eller UTM-kampagner. Det holder støjen nede
          og sikrer, at den rigtige kollega bliver pinget, når noget uventet sker.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Planlæg stilleperioder pr. workspace, så natlige deploys ikke udløser falske positiver.</li>
          <li>Send alarmer til flere destinationer (e-mail, Slack, Discord) på én gang.</li>
          <li>
            Opret tærskler pr. dimension, f.eks. &ldquo;bounce rate stiger 15% for betalt trafik i Danmark&rdquo;.
          </li>
        </ul>
      </section>

      <section>
        <h2>Hurtigere undersøgelser</h2>
        <p>
          Funnels, verdenskort og trafiktabeller viser nu et overlay for svartider. Hold musen over et datapunkt
          for at se, hvilken region eller landing page der sænker konverteringer.
        </p>
        <figure className='border-border/60 bg-muted/20 mt-6 overflow-hidden rounded-2xl border shadow-sm'>
          <Image
            src='/images/demo-dashboard-desktop-dark.webp'
            width={1440}
            height={900}
            priority={false}
            className='object-cover'
            alt='Betterlytics tragt-visualisering med latency-overlays'
          />
          <figcaption className='text-muted-foreground border-border/60 border-t px-6 py-3 text-center text-xs tracking-[0.35em] uppercase'>
            Debug journeys uden at forlade Betterlytics
          </figcaption>
        </figure>
      </section>

      <section>
        <h2>Platformpolish</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Genopbygget indtagskøen, så fejlformede events retries uden at blokere de sunde.</li>
          <li>Forbedret samples i funnels, så trin er konsistente på tværs af retroaktive datointervaller.</li>
          <li>
            Udvidet det offentlige demo-datasæt med nye trafiksegmenter, så sammenligninger føles realistiske.
          </li>
        </ul>
      </section>
    </>
  );
}
