import { IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import './v2/landing-v2.css';

/* Landing-only faces. Loaded here rather than in the root layout so the app keeps its own type. */
const sans = Schibsted_Grotesk({
  variable: '--font-lp2-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-lp2-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

/**
 * The redesigned landing page brings its own nav and footer, so it lives
 * beside (public) rather than inside it. Everything under .lp2 is scoped by
 * landing-v2.css and dark-only by design.
 */
export default function LandingV2Layout({ children }: { children: React.ReactNode }) {
  return <div className={`lp2 ${sans.variable} ${mono.variable}`}>{children}</div>;
}
