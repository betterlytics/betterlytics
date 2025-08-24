import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: {
  params: Promise<{ mdxPath?: string[] }>;
}) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  if (metadata?.alternates?.canonical) return metadata;

  const canonicalPath =
    Array.isArray(params.mdxPath) && params.mdxPath.length > 0
      ? `/docs/${params.mdxPath.join("/")}`
      : "/docs";

  return {
    ...metadata,
    alternates: {
      ...(metadata?.alternates ?? {}),
      canonical: canonicalPath,
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
