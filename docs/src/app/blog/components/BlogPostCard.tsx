import Image from "next/image";
import Link from "next/link";
import { type BlogPost } from "../lib/registry";
import { getAuthor } from "../lib/authors";
import { cn } from "@/lib/utils";

type Props = {
  post: BlogPost;
  featured?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogPostCard({ post, featured = false }: Props) {
  const author = getAuthor(post.frontmatter.author);
  const tag = post.frontmatter.tags[0];

  return (
    <Link
      href={post.url}
      className={cn(
        "group bg-card border-border hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border transition-colors",
        featured && "md:flex-row"
      )}
    >
      <div
        className={cn(
          "bg-muted relative aspect-[16/9] w-full overflow-hidden",
          featured && "md:aspect-auto md:w-1/2"
        )}
      >
        <Image
          src={post.frontmatter.coverImage.src}
          alt={post.frontmatter.coverImage.alt}
          fill
          sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col p-6 sm:p-7",
          featured && "md:p-9"
        )}
      >
        {tag && (
          <div className="text-primary mb-3 text-xs font-semibold tracking-wide uppercase">
            {tag}
          </div>
        )}
        <h2
          className={cn(
            "text-foreground group-hover:text-primary text-xl font-bold tracking-tight transition-colors",
            featured && "md:text-2xl"
          )}
        >
          {post.frontmatter.title}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {post.frontmatter.description}
        </p>
        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-6 text-xs">
          <span className="text-foreground font-medium">{author.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.frontmatter.publishedAt}>
            {formatDate(post.frontmatter.publishedAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTimeMinutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
