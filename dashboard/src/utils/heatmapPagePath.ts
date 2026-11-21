/**
 * The values a real page path gives a heatmap page path's wildcards, or null when it doesn't
 * belong to it. The tracker's `data-dynamic-urls` grouping stores each wildcard as `*`, also
 * for `**` patterns that span several segments, so a `*` stands for one or more characters.
 */
export function matchPagePath(pagePath: string, path: string): string[] | null {
  const parts = pagePath.split('*');
  if (parts.length === 1) return path === pagePath ? [] : null;

  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!path.startsWith(first)) return null;

  const values: string[] = [];
  let position = first.length;
  for (const part of parts.slice(1, -1)) {
    const found = path.indexOf(part, position + 1);
    if (found === -1) return null;
    values.push(path.slice(position, found));
    position = found + part.length;
  }
  const end = path.length - last.length;
  if (end <= position || !path.endsWith(last)) return null;
  values.push(path.slice(position, end));
  return values;
}

export function matchesPagePath(pagePath: string, path: string): boolean {
  return matchPagePath(pagePath, path) !== null;
}

/** The path part of a page address such as `/profile/betterlytics/posts?tab=new`, encoded like the tracker's */
export function pathnameOf(pageAddress: string): string {
  return new URL(pageAddress, 'https://page.invalid').pathname;
}
