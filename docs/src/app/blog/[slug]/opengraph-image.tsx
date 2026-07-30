import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBlogPostBySlug, getBlogPosts } from "@/app/blog/lib/registry";

// Per-post social card (og:image). The file convention wires the meta tags
// automatically and — unlike the old query-param route — exposes no free-text
// inputs. Metadata image files are specialized route handlers, so they take
// their own segment config: force-static + generateStaticParams prerenders one
// immutable PNG per published slug, leaving no runtime Satori surface (the
// page's own generateStaticParams does not cover this route).

export const dynamic = "force-static";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export const alt = "Betterlytics Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  bg: "#101113",
  fg: "#F2F3F5",
  fgBright: "#FFFFFF",
  fgMuted: "#A8A8AF",
  fgDim: "#6E7076",
  blue: "#60A5FA",
  divider: "#7A7C80",
};

const HEADER_H = 100;
const RIGHT_COL_W = 100;
const DIVIDER_W = 2;
const PAD_L = 64;
const PAD_R = RIGHT_COL_W + 32;

const FONT_DIR = join(process.cwd(), "assets", "fonts");
const LOGO_PATH = join(
  process.cwd(),
  "public",
  "betterlytics-logo-light-simple.svg",
);

let fontCache: { w500: Buffer; w700: Buffer } | null = null;
let logoDataUrl: string | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const [w500, w700] = await Promise.all([
    readFile(join(FONT_DIR, "inter-tight-latin-500-normal.woff")),
    readFile(join(FONT_DIR, "inter-tight-latin-700-normal.woff")),
  ]);
  fontCache = { w500, w700 };
  return fontCache;
}

async function loadLogoDataUrl() {
  if (logoDataUrl) return logoDataUrl;
  const svg = await readFile(LOGO_PATH, "utf8");
  logoDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return logoDataUrl;
}

type Segment = { text: string; blue?: boolean };

function highlight(title: string, blueWord?: string | null): Segment[] {
  if (!blueWord) return [{ text: title }];
  const i = title.indexOf(blueWord);
  if (i === -1) return [{ text: title }];
  return [
    { text: title.slice(0, i) },
    { text: blueWord, blue: true },
    { text: title.slice(i + blueWord.length) },
  ];
}

type Props = { params: Promise<{ slug: string }> };

export default async function Image(props: Props): Promise<ImageResponse> {
  const { slug } = await props.params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const title = post.frontmatter.title;
  const blueWord = post.frontmatter.blueWord ?? null;

  const { w500, w700 } = await loadFonts();
  const logoSrc = await loadLogoDataUrl();
  const titleSize = title.length > 60 ? 60 : 72;
  const segments = highlight(title, blueWord);

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          background: C.bg,
          color: C.fg,
          fontFamily: "Inter Tight",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: RIGHT_COL_W,
            width: DIVIDER_W,
            background: C.divider,
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: HEADER_H,
            height: DIVIDER_W,
            background: C.divider,
            zIndex: 2,
          }}
        />
        <div
          style={{
            height: HEADER_H,
            paddingLeft: PAD_L,
            paddingRight: PAD_R,
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: "-0.02em",
            flex: "0 0 auto",
            position: "relative",
            zIndex: 3,
          }}
        >
          <img src={logoSrc} width={52} height={52} alt="" />
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: C.fgBright }}>Betterlytics</span>
            <span
              style={{
                color: C.fgDim,
                fontWeight: 500,
                marginLeft: 12,
              }}
            >
              Blog
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            paddingLeft: PAD_L,
            paddingRight: PAD_R,
            paddingTop: 36,
            paddingBottom: 56,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {segments.map((s, i) => (
              <span
                key={i}
                style={{ color: s.blue ? C.blue : C.fg, whiteSpace: "pre-wrap" }}
              >
                {s.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter Tight", data: w500, weight: 500, style: "normal" },
        { name: "Inter Tight", data: w700, weight: 700, style: "normal" },
      ],
    },
  );
}
