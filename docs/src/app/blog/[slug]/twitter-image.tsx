// Same card as og:image — the convention only emits twitter:image from this
// file, so re-export rather than rely on platform-side og:image fallback.
// Segment config can't be re-exported (Next reads it via static analysis),
// so `dynamic` is declared here even though everything else is shared.
export const dynamic = "force-static";

export {
  default,
  alt,
  size,
  contentType,
  generateStaticParams,
} from "./opengraph-image";
