import { isValidElement } from 'react';

/**
 * Interpolates a template string like "Created at {{date}}" with React nodes or strings.
 *
 * @param template - The string template with placeholders in the form {{key}}.
 * @param interpolations - A mapping of keys to React nodes or strings to inject into the template.
 * @returns An array of React nodes representing the interpolated template.
 *
 * @example
 * interpolateReactTemplate("Created at {{date}}", {
 *   date: <strong>2023-01-01</strong>
 * });
 * // => ["Created at ", <strong>2023-01-01</strong>]
 */
/**
 * Interpolates a template string like "Created at {{date}}" with React nodes or strings.
 *
 * @param template - The string template with placeholders in the form {{key}}.
 * @param interpolations - A mapping of keys to React nodes or strings to inject into the template.
 * @returns A single React node wrapping the full interpolated content (safe for hydration).
 *
 * @example
 * interpolateReactTemplate("Created at {{date}}", {
 *   date: <strong>2023-01-01</strong>
 * });
 * // => <span>Created at </span><strong>2023-01-01</strong>
 */
export function interpolateReactTemplate(
  template: string,
  interpolations: Record<string, React.ReactNode>,
): React.ReactNode {
  const result: React.ReactNode[] = [];
  let cursor = 0;

  while (true) {
    const start = template.indexOf('{{', cursor);
    if (start === -1) {
      // No more placeholders, push remaining text
      if (cursor < template.length) result.push(template.slice(cursor));
      break;
    }

    // Push text before the placeholder if any
    if (start > cursor) {
      result.push(template.slice(cursor, start));
    }

    const end = template.indexOf('}}', start + 2);
    if (end === -1) {
      // No closing braces, push rest of string and stop
      result.push(template.slice(start));
      break;
    }

    const key = template.slice(start + 2, end).trim();
    const node = interpolations[key];

    result.push(isValidElement(node) ? node : String(node));

    cursor = end + 2;
  }

  return (
    <>
      {result.map((node, i) => (
        <span key={i}>{node}</span>
      ))}
    </>
  );
}
