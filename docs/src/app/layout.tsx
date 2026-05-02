import { Head } from "nextra/components";
import "./globals.css";
import { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { docsTrackingEnabled, env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL("https://betterlytics.io"),
};

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
      <body>
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
