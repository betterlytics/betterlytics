import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: {
  params: Promise<{ mdxPath?: string[] }>;
}) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);

  const canonicalPath =
    Array.isArray(params.mdxPath) && params.mdxPath.length > 0
      ? `/docs/${params.mdxPath.join("/")}`
      : "/docs";

  const category =
    Array.isArray(params.mdxPath) && params.mdxPath.length > 0
      ? params.mdxPath[0]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : null;

  const ogImageParams = new URLSearchParams();
  if (metadata?.title) {
    ogImageParams.set("title", metadata.title);
  }
  if (category) {
    ogImageParams.set("category", category);
  }
  if (metadata?.description) {
    ogImageParams.set("description", metadata.description);
  }

  const ogImageUrl = `/api/og?${ogImageParams.toString()}`;

  return {
    ...metadata,
    alternates: {
      ...(metadata?.alternates ?? {}),
      canonical: canonicalPath,
    },
    openGraph: {
      ...(metadata?.openGraph ?? {}),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metadata?.title || "Betterlytics Docs",
        },
      ],
    },
    twitter: {
      ...(metadata?.twitter ?? {}),
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: {
  params: Promise<{ mdxPath?: string[] }>;
}) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
