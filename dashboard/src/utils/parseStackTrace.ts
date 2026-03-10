import type { StackFrame } from '@/entities/analytics/errors.entities';

const FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\((.+?):(\d+):(\d+)\)|(.+?):(\d+):(\d+))\s*$/;

export function parseStackTrace(stack: string): StackFrame[] {
  return stack
    .split('\n')
    .slice(1)
    .flatMap((line) => {
      const m = FRAME_REGEX.exec(line);
      if (!m) return [];
      const [, namedFn, namedFile, namedLine, namedCol, anonFile, anonLine, anonCol] = m;
      const fn = namedFn ?? '<anonymous>';
      const file = namedFile ?? anonFile ?? '';
      const line_ = parseInt(namedLine ?? anonLine ?? '0', 10);
      const col = parseInt(namedCol ?? anonCol ?? '0', 10);
      const inApp = !file.includes('node_modules') && !file.startsWith('node:');
      return [{ fn, file, line: line_, col, inApp }] satisfies StackFrame[];
    });
}
