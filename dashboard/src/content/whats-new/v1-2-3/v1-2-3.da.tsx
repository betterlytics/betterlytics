import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.2.3',
  releasedAt: '2025-08-18',
  title: 'Måned med stabilitet',
  summary: 'Stabiliseret session replay-lagring, enklere kvotaovervågning og finjusteret attribueringsmotor.',
};

export default function ReleaseV123ContentDa() {
  return (
    <>
      <section>
        <h2>Replay-retention</h2>
        <p>
          Session replay-filer ligger nu i redundant objektlagring med automatiske livscyklusregler. Afspilleren
          har også en genvej &ldquo;hop til rage click&rdquo;, der finder det præcise øjeblik, hvor en besøgende
          kæmpede.
        </p>
        <ul className='list-inside list-disc space-y-1'>
          <li>Hver replay viser tydeligt, hvor mange dage der er tilbage, før den udløber.</li>
          <li>Download optagelser uden at forlade tidslinjen.</li>
          <li>Teammedlemmer kan efterlade private noter direkte på replayet.</li>
        </ul>
      </section>

      <section>
        <h2>Klare kvoter</h2>
        <p>
          Billing viser nu eventforbrug pr. site samt anbefalinger til at holde sig under bløde grænser. Advarsler
          giver besked, når 80% af planen er brugt, så du kan nå at opgradere eller rydde støjende events op.
        </p>
      </section>

      <section>
        <h2>Finjusteret attribuering</h2>
        <ul className='list-inside list-disc space-y-1'>
          <li>Referrers med lange query strings normaliseres nu automatisk.</li>
          <li>UTM-parametre respekterer last non-direct-attribuering ved sammenligning af perioder.</li>
          <li>Kampagnedrilldowns loader dobbelt så hurtigt takket være nye materialiserede views i ClickHouse.</li>
        </ul>
      </section>
    </>
  );
}
