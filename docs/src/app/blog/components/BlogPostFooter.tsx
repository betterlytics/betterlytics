import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type BlogPost } from "../lib/registry";
import { GitHubIcon } from "../../components/SocialIcons";

type Props = {
  post: BlogPost;
  previous?: BlogPost;
  next?: BlogPost;
};

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
            Get started free <ArrowRight size={13} aria-hidden="true" />
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
                <ArrowLeft size={12} aria-hidden="true" /> Previous
              </span>
              <span className="ttl">{previous.frontmatter.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="next-card right" href={next.url}>
              <span className="dir">
                Next <ArrowRight size={12} aria-hidden="true" />
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
