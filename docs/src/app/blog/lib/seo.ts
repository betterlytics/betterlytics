import { type BlogPost } from "./registry";
import { getAuthor } from "./authors";

export const SITE_URL = "https://betterlytics.io";

export function blogPostCanonicalUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function blogIndexCanonicalUrl(): string {
  return `${SITE_URL}/blog`;
}

export function buildArticleJsonLd(post: BlogPost) {
  const author = getAuthor(post.frontmatter.author);
  const url = blogPostCanonicalUrl(post.slug);
  const image = post.frontmatter.ogImage ?? post.frontmatter.coverImage.src;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    image: absoluteImage,
    datePublished: post.frontmatter.publishedAt,
    dateModified: post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
    author: {
      "@type": "Organization",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Betterlytics",
      logo: {
        "@type": "ImageObject",
        url: "https://betterlytics.io/betterlytics-logo-full-light.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: post.frontmatter.keywords.join(", "),
    inLanguage: "en",
  };
}

export function buildFaqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function buildBlogIndexJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    url: blogIndexCanonicalUrl(),
    name: "The Betterlytics Blog",
    inLanguage: "en",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.frontmatter.title,
      url: blogPostCanonicalUrl(p.slug),
      datePublished: p.frontmatter.publishedAt,
    })),
  };
}
