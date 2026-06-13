import Image from "next/image";
import Link from "next/link";
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

function ArrowLeftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
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
        <ArrowLeftIcon /> All posts
      </Link>

      <div className="post-eyebrow">
        {tag && <span className="cat">{tag}</span>}
        {tag && <span className="sep">·</span>}
        <time dateTime={post.frontmatter.publishedAt}>
          {formatDate(post.frontmatter.publishedAt)}
        </time>
        <span className="sep">·</span>
        <span className="time">
          <ClockIcon /> {post.readingTimeMinutes} min read
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
