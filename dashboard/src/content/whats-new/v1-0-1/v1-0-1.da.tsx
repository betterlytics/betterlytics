import type { WhatsNewMetadata } from '@/entities/whats-new';

export const metadata: WhatsNewMetadata = {
  version: 'v1.0.1',
  releasedAt: '2025-08-11',
  title: 'Social Login, Funnels & Gravatar Avatars',
  summary:
    'Denne opdatering introducerer login med Google og GitHub, nye funnel-analyser til at spore frafald, og valgfri Gravatar-avatarer til arbejdsområder.',
};

export default function ReleaseV101ContentDA() {
  return (
    <>
      <section>
        <h2>Login med Google & GitHub</h2>
        <p>
          Brugere kan nu logge ind med Google eller GitHub for lettere onboarding og hurtigere oprettelse af konto.
        </p>
      </section>

      <section>
        <h2>Funnels til Frafaldsanalyse</h2>
        <p>
          Funnels er nu tilgængelige, så du kan visualisere, hvordan brugere bevæger sig gennem flertrinsrejser, og
          hvor de falder fra. Brug dette til at optimere tilmeldingsflows, onboarding og andre nøglekonverteringer.
        </p>
      </section>

      <section>
        <h2>Gravatar Avatarer</h2>
        <p>
          Brugere kan nu aktivere Gravatar-baserede profilbilleder, hvilket giver simple og genkendelige avatarer
          uden behov for upload.
        </p>
      </section>
    </>
  );
}
