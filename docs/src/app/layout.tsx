import { Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "./globals.css";
import { Metadata } from "next";
import { Footer } from "./components/footer";
import { getAssetPath } from "@/lib/constants";
import NextTopLoader from "nextjs-toploader";
import ExternalLink from "@/shared/ExternalLink";
import Script from "next/script";
import { docsTrackingEnabled, env } from "@/lib/env";
import Logo from "./components/logo";

export const metadata: Metadata = {
  title: "Betterlytics Docs",
  description:
    "Betterlytics documentation — guides, tutorials, and references for the privacy-first, cookieless analytics platform.",
  metadataBase: new URL("https://betterlytics.io"),
  openGraph: {
    type: "website",
    url: "/docs",
    siteName: "Betterlytics",
    title: "Betterlytics Docs",
    description:
      "Betterlytics documentation — guides, tutorials, and references for the privacy-first, cookieless analytics platform.",
    images: [
      {
        url: getAssetPath("/og_image_docs.png"),
        width: 1200,
        height: 630,
        alt: "Betterlytics documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Betterlytics Docs",
    description:
      "Betterlytics documentation — guides, tutorials, and references for the privacy-first, cookieless analytics platform.",
    images: [getAssetPath("/og_image_docs.png")],
    creator: "@betterlytics",
  },
  icons: {
    icon: [
      { url: getAssetPath("/icon0.svg"), type: "image/svg+xml" },
      { url: getAssetPath("/favicon.ico"), type: "image/x-icon" },
    ],
    apple: [{ url: getAssetPath("/apple-icon.png"), sizes: "180x180" }],
  },
};

const navbar = (
  <>
    <Navbar
      logo={<Logo variant="icon" width={32} height={32} priority />}
      projectLink="https://github.com/betterlytics/betterlytics"
      chatLink="https://discord.gg/vwqSvPn6sP"
    >
      <ExternalLink
        href="https://betterlytics.io/dashboards"
        title="To Dashboard"
      >
        To Dashboard
      </ExternalLink>
    </Navbar>
    <NextTopLoader
      color="var(--primary)"
      height={3}
      showSpinner={false}
      shadow={false}
    />
  </>
);

const footer = <Footer />;

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
              name: "Betterlytics Docs",
              url: "https://betterlytics.io/docs",
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
            data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/track`}
            data-web-vitals="true"
            data-outbound-links="full"
          />
        )}
        <Layout
          navbar={navbar}
          sidebar={{ autoCollapse: true }}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/betterlytics/betterlytics/tree/main/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
