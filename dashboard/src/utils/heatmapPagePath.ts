/**
 * Whether a real page path belongs to a heatmap page path. The tracker's `data-dynamic-urls`
 * grouping stores each wildcard as `*`, also for `**` patterns that span several segments,
 * so a `*` stands for one or more characters.
 */
export function matchesPagePath(pagePath: string, path: string): boolean {
  const parts = pagePath.split('*');
  if (parts.length === 1) return path === pagePath;

  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!path.startsWith(first)) return false;

  let position = first.length;
  for (const part of parts.slice(1, -1)) {
    const found = path.indexOf(part, position + 1);
    if (found === -1) return false;
    position = found + part.length;
  }
  return path.length - last.length > position && path.endsWith(last);
}

/** The path part of a page address such as `/profile/betterlytics/posts?tab=new`, encoded like the tracker's */
export function pathnameOf(pageAddress: string): string {
  return new URL(pageAddress, 'https://page.invalid').pathname;
}
