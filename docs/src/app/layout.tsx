import { Head } from "nextra/components";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { docsTrackingEnabled, env } from "@/lib/env";

export const metadata: Metadata = {
  title: {
    default: "Betterlytics Docs",
    template: "%s - Betterlytics Docs",
  },
  description:
    "Betterlytics documentation — guides, tutorials, and references for the privacy-first, cookieless analytics platform.",
  metadataBase: new URL("https://betterlytics.io"),
};

const robotoSans = Inter({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
  weight: "400",
});

const robotoMono = Inter_Tight({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr" // Required to be set
      suppressHydrationWarning
    >
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Betterlytics",
              url: "https://betterlytics.io",
              inLanguage: "en",
              publisher: {
                "@type": "Organization",
                name: "Betterlytics",
                logo: "https://betterlytics.io/betterlytics-logo-full-light.png",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
      </Head>
      <body className={`${robotoSans.variable} ${robotoMono.variable} antialiased`}>
        {docsTrackingEnabled && (
          <Script
            async
            src={`${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
            data-site-id={env.APP_TRACKING_SITE_ID}
            data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/event`}
            data-web-vitals="true"
            data-outbound-links="full"
          />
        )}
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          shadow={false}
        />
        {children}
      </body>
    </html>
  );
}
