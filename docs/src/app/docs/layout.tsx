import { Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import { Metadata } from "next";
import { Footer } from "../components/footer";
import { getAssetPath } from "@/lib/constants";
import ExternalLink from "@/shared/ExternalLink";
import Logo from "../components/logo";

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
        url: getAssetPath("/og_image.jpg"),
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
    images: [getAssetPath("/og_image.jpg")],
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
  <Navbar
    logo={
      <>
        <span className="md:hidden">
          <Logo variant="icon" width={32} height={32} priority />
        </span>
        <span className="hidden md:inline-block">
          <Logo variant="simple" width={28} height={28} showText textSize="sm" priority />
        </span>
      </>
    }
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
);

const footer = <Footer />;

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout
      navbar={navbar}
      sidebar={{ autoCollapse: true }}
      pageMap={await getPageMap("/docs")}
      docsRepositoryBase="https://github.com/betterlytics/betterlytics/tree/main/docs"
      editLink={null}
      footer={footer}
    >
      {children}
    </Layout>
  );
}
