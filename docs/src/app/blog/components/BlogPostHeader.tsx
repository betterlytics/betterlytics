import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { type BlogPost } from "../lib/registry";
import { resolveCover } from "../lib/cover";
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

function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function BlogPostHeader({ post }: Props) {
  const author = getAuthor(post.frontmatter.author);
  const tag = post.frontmatter.tags[0];
  const cover = resolveCover(post);

  return (
    <header>
      <Link className="post-back" href="/blog">
        <ArrowLeft size={12} aria-hidden="true" /> All posts
      </Link>

      <div className="post-eyebrow">
        {tag && <span className="cat">{tag}</span>}
        {tag && <span className="sep">·</span>}
        <time dateTime={post.frontmatter.publishedAt}>
          {formatDate(post.frontmatter.publishedAt)}
        </time>
        <span className="sep">·</span>
        <span className="time">
          <Clock size={12} aria-hidden="true" /> {post.readingTimeMinutes} min
          read
        </span>
      </div>

      <h1 className="post-title">{post.frontmatter.title}</h1>
      <p className="post-deck">{post.frontmatter.description}</p>

      <div className="post-byline">
        <div className="avatar-stack">
          <span className="avatar" title={author.name}>
            {authorInitials(author.name) || "B"}
          </span>
        </div>
        <div className="author-info">
          <div className="names">{author.name}</div>
          {author.role && <div className="meta">{author.role}</div>}
        </div>
      </div>

      <div className="post-cover">
        <Image
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          priority
          unoptimized={cover.generated}
          sizes="(min-width: 1100px) 680px, 100vw"
        />
      </div>
    </header>
  );
}
