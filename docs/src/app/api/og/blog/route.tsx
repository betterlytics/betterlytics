import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBlogPostBySlug } from "@/app/blog/lib/registry";

// Variant E.3.3 of the locked design: dark canvas, two hairline dividers,
// header (B-mark + "Betterlytics Blog"), centered title with one blue word.
// No corner fill, no bottom chart, no tag pills.

// Hex equivalents of the design's hsl()/oklch() tokens — Satori's CSS color
// parser falls back to black on the modern oklch() syntax, so we pre-resolve.
const C = {
  bg: "#101113",       // hsl(222 5% 6.5%)
  fg: "#F2F3F5",       // oklch(0.96 0.01 265)
  fgBright: "#FFFFFF", // pure white for the wordmark (header contrast lift)
  fgMuted: "#A8A8AF",  // oklch(0.7 0.02 265) — body / generic muted
  fgDim: "#6E7076",    // deeper muted for header 'Blog' wordmark
  blue: "#60A5FA",     // tailwind blue-400 — matches landing hero's `dark:text-blue-400` highlight
  divider: "#7A7C80",  // brightened from hsl(0 0% 38%) — more confident architecture
};

const W = 1200;
const H = 630;
const HEADER_H = 100;
const RIGHT_COL_W = 100;
const DIVIDER_W = 2;
const PAD_L = 64;
const PAD_R = RIGHT_COL_W + 32; // 132

const FONT_DIR = join(process.cwd(), "assets", "fonts");
const LOGO_PATH = join(
  process.cwd(),
  "public",
  "betterlytics-logo-light-simple.svg"
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

export async function GET(req: NextRequest): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const titleOverride = searchParams.get("title");
  const blueWordOverride = searchParams.get("blueWord");

  let title = titleOverride ?? "Betterlytics Blog";
  let blueWord: string | null = blueWordOverride;

  if (slug) {
    const post = await getBlogPostBySlug(slug);
    if (post) {
      title = titleOverride ?? post.frontmatter.title;
      blueWord = blueWordOverride ?? post.frontmatter.blueWord ?? null;
    }
  }

  const { w500, w700 } = await loadFonts();
  const logoSrc = await loadLogoDataUrl();
  const titleSize = title.length > 60 ? 60 : 72;
  const segments = highlight(title, blueWord);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: C.bg,
          color: C.fg,
          fontFamily: "Inter Tight",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >

        {/* z=2 — vertical divider */}
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
        {/* z=2 — horizontal divider */}
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

        {/* z=3 — header */}
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

        {/* z=3 — body */}
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
      width: W,
      height: H,
      fonts: [
        { name: "Inter Tight", data: w500, weight: 500, style: "normal" },
        { name: "Inter Tight", data: w700, weight: 700, style: "normal" },
      ],
    }
  );
}
