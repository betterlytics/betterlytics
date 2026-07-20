import { getBlogPosts, getBlogPostBySlug } from "@/app/blog/lib/registry";
import {
  coverOptionsForPost,
  pngResponse,
  renderCover,
} from "@/app/blog/lib/cover-render";

// Canonical per-post blog cover, prerendered at build time — one immutable PNG
// per slug, served with no runtime compute. The pixels are deterministic from
// frontmatter; the sibling `/api/blog/cover` route stays dynamic for tuning.
//
// `resolveCover` appends a `?v=<hash>` token to the src so a cover config/text
// change busts the immutable client cache on the next deploy (the query is
// ignored here — the same static body is served for the path).
export const dynamic = "force-static";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const bytes = await renderCover(coverOptionsForPost(post));
  return pngResponse(bytes);
}
