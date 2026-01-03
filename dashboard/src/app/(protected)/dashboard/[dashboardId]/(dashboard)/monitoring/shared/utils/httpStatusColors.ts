export type StatusCodeCategory = '2xx' | '3xx' | '4xx' | '5xx';

const STATUS_CODE_COLORS: Record<StatusCodeCategory, { bg: string; text: string; border: string }> = {
  '2xx': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  '3xx': { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
  '4xx': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  '5xx': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
};

export function getStatusCodeCategory(code: number | string): StatusCodeCategory {
  const codeStr = String(code).toLowerCase();
  if (codeStr.startsWith('2') || codeStr === '2xx') return '2xx';
  if (codeStr.startsWith('3') || codeStr === '3xx') return '3xx';
  if (codeStr.startsWith('4') || codeStr === '4xx') return '4xx';
  return '5xx';
}

export function getStatusCodeColorClasses(code: number | string): string {
  const { bg, text, border } = STATUS_CODE_COLORS[getStatusCodeCategory(code)];
  return `${bg} ${text} ${border}`;
}
