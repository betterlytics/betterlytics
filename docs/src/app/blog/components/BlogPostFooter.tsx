import Link from "next/link";
import { type BlogPost } from "../lib/registry";
import { GitHubIcon } from "../../components/SocialIcons";

type Props = {
  post: BlogPost;
  previous?: BlogPost;
  next?: BlogPost;
};

function ArrowRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
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

function NextArrowIcon() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function BlogPostFooter({ post, previous, next }: Props) {
  const { citations, tags } = post.frontmatter;

  return (
    <div className="post-footer">
      {tags.length > 0 && (
        <div className="footer-tags">
          {tags.map((t) => (
            <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="tag">
              #{t.toLowerCase()}
            </Link>
          ))}
        </div>
      )}

      {citations.length > 0 && (
        <section className="post-sources">
          <h2>Sources</h2>
          <ol>
            {citations.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="cta-block">
        <h3>Try Betterlytics</h3>
        <p>
          One dashboard for analytics, session replay, errors, uptime, and
          Core Web Vitals. Cookieless by default, EU-hosted, open source under
          AGPL-3.0.
        </p>
        <div className="cta-row">
          <a
            className="btn btn-primary"
            href="https://betterlytics.io/signup"
          >
            Get started free <ArrowRightIcon />
          </a>
          <a
            className="btn btn-outline"
            href="https://github.com/betterlytics/betterlytics"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon className="h-3.5 w-3.5" /> Source on GitHub
          </a>
        </div>
      </div>

      {(previous || next) && (
        <div className="next-row">
          {previous ? (
            <Link className="next-card" href={previous.url}>
              <span className="dir">
                <ArrowLeftIcon /> Previous
              </span>
              <span className="ttl">{previous.frontmatter.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="next-card right" href={next.url}>
              <span className="dir">
                Next <NextArrowIcon />
              </span>
              <span className="ttl">{next.frontmatter.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
