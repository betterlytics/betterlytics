import type { ReactNode } from "react";
import { Code } from "nextra/components";

const headerCell = "px-4 py-4 text-left text-sm font-medium text-[color:var(--muted-foreground)] lg:px-6";
const desktopCell = "align-top md:table-cell md:px-4 md:py-3.5 lg:px-6";
const cell = `block ${desktopCell}`;

// Fixed column widths so consecutive tables on a page line up
export function EnvTable({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]">
      <table className="block w-full text-sm md:table md:table-fixed">
        <colgroup className="hidden md:table-column-group">
          <col className="w-[17rem]" />
          <col className="w-32" />
          <col />
        </colgroup>
        <thead className="hidden md:table-header-group">
          <tr className="bg-[color:var(--muted)]">
            <th className={headerCell}>Variable</th>
            <th className={headerCell}>Default</th>
            <th className={headerCell}>Behavior</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">{children}</tbody>
      </table>
    </div>
  );
}

// A string default renders as code; pass a fragment for prose such as "derived"
export function EnvVar({
  name,
  default: defaultValue,
  children,
}: {
  name: string | string[];
  default?: ReactNode;
  children: ReactNode;
}) {
  const names = Array.isArray(name) ? name : [name];

  return (
    <tr className="block border-t border-[color:var(--border)] first:border-t-0 md:first:border-t px-4 py-3 transition-colors md:table-row md:p-0 md:hover:bg-[color:var(--muted)]">
      <td className={cell}>
        <div className="flex flex-col items-start gap-1">
          {names.map((n) => (
            <Code key={n}>{n}</Code>
          ))}
        </div>
      </td>
      <td className={defaultValue == null ? `hidden ${desktopCell}` : `${cell} mt-2 md:mt-0`}>
        {defaultValue != null && (
          <>
            <span className="text-[color:var(--muted-foreground)] md:hidden">Default: </span>
            {typeof defaultValue === "string" ? <Code>{defaultValue}</Code> : defaultValue}
          </>
        )}
      </td>
      <td
        className={`${cell} mt-2 leading-relaxed text-[color:var(--foreground)] [overflow-wrap:anywhere] md:mt-0 [&_code]:[overflow-wrap:anywhere]!`}
      >
        {children}
      </td>
    </tr>
  );
}
