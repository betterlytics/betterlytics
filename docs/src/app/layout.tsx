import { Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "./globals.css";
import { Metadata } from "next";
import Image from "next/image";
import { Footer } from "./components/footer";
import { getAssetPath } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Betterlytics Docs",
  description: "Betterlytics Docs",
  icons: {
    icon: [
      {
        url: getAssetPath("/images/favicon-dark.svg"),
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: getAssetPath("/images/favicon-light.svg"),
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
    ],
  },
};

const navbar = (
  <Navbar
    logo={
      <Image
        src={getAssetPath("/images/favicon-dark.svg")}
        alt="Betterlytics"
        width={32}
        height={32}
        className="object-contain"
        priority
      />
    }
    projectLink="https://github.com/betterlytics/betterlytics"
    chatLink="https://discord.gg/vwqSvPn6sP"
  >
    <a href="https://betterlytics.io">To Dashboard</a>
  </Navbar>
);

const banner = (
  <Banner storageKey="some-key">
    🚧 Betterlytics Docs is being worked on 🚧
  </Banner>
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
      <Head></Head>
      <body>
        <Layout
          banner={banner}
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
