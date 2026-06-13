"use client";

import { useEffect, useState } from "react";

type Heading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function BlogToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.querySelector(".blog-prose");
    if (!root) return;

    const nodes = root.querySelectorAll<HTMLHeadingElement>(
      "h2[id], h3[id]"
    );
    const next: Heading[] = Array.from(nodes).map((el) => ({
      id: el.id,
      text: el.textContent ?? "",
      level: el.tagName === "H3" ? 3 : 2,
    }));
    setHeadings(next);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const onScroll = () => {
      let current: string | null = headings[0]?.id ?? null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top < 140) {
          current = h.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="blog-toc">
      <div className="toc-heading">On this page</div>
      <ol>
        {headings.map((h) => (
          <li
            key={h.id}
            className={
              (h.id === activeId ? "is-active" : "") +
              (h.level === 3 ? " is-h3" : "")
            }
          >
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
