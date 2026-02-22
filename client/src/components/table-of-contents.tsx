import { extractHeadings } from "@/lib/markdown";

export function TableOfContents({ markdown }: { markdown: string }) {
  const headings = extractHeadings(markdown);
  if (headings.length < 2) return null;

  return (
    <nav className="rounded-md border border-card-border bg-card p-4" data-testid="table-of-contents">
      <h4 className="font-semibold text-sm mb-3">Table of Contents</h4>
      <ul className="space-y-1.5">
        {headings.map((h, i) => (
          <li key={i} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
            <a
              href={`#${h.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block leading-relaxed"
              data-testid={`link-toc-${h.id}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
