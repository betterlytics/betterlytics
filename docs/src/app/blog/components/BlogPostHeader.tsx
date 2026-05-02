import Image from "next/image";
import { type BlogPost } from "../lib/registry";
import { getAuthor } from "../lib/authors";

type Props = {
  post: BlogPost;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogPostHeader({ post }: Props) {
  const author = getAuthor(post.frontmatter.author);
  const tag = post.frontmatter.tags[0];

  return (
    <header className="mx-auto max-w-3xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
      {tag && (
        <div className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">
          {tag}
        </div>
      )}
      <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
        {post.frontmatter.title}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        {post.frontmatter.description}
      </p>
      <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-foreground font-medium">{author.name}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.frontmatter.publishedAt}>
          {formatDate(post.frontmatter.publishedAt)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTimeMinutes} min read</span>
      </div>
      <div className="border-border mt-10 overflow-hidden rounded-xl border">
        <Image
          src={post.frontmatter.coverImage.src}
          alt={post.frontmatter.coverImage.alt}
          width={post.frontmatter.coverImage.width}
          height={post.frontmatter.coverImage.height}
          priority
          className="h-auto w-full object-cover"
        />
      </div>
    </header>
  );
}
