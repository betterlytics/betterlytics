export type MeasureFn = (text: string) => number;

export const ELLIPSIS = '…';
const SLACK = 1;
const RISK_GATE = /[\p{M}\u200D\uFE0E\uFE0F\u{1F1E6}-\u{1F1FF}]/u;
const JOINER = /[\p{M}\u200D\uFE0E\uFE0F]/u;
const REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/u;

function retractHead(units: string[], end: number): number {
  while (end > 0) {
    if (JOINER.test(units[end] ?? '')) {
      end -= 1;
      continue;
    }
    if (units[end - 1] === '\u200D') {
      end -= 1;
      continue;
    }
    let run = 0;
    while (end - 1 - run >= 0 && REGIONAL.test(units[end - 1 - run])) run += 1;
    if (run % 2 === 1) {
      end -= 1;
      continue;
    }
    return end;
  }
  return 0;
}

function advanceTail(units: string[], start: number): number {
  while (start < units.length) {
    if (JOINER.test(units[start] ?? '')) {
      start += 1;
      continue;
    }
    let run = 0;
    while (start + run < units.length && REGIONAL.test(units[start + run])) run += 1;
    if (run % 2 === 1) {
      start += 1;
      continue;
    }
    return start;
  }
  return units.length;
}

export function fitMidEllipsis(value: string, availablePx: number, measure: MeasureFn): string {
  const budget = availablePx - SLACK;
  if (measure(value) <= budget) return value;

  const units = [...value];
  const risky = RISK_GATE.test(value);

  const compose = (k: number): string => {
    let head = Math.ceil(k / 2);
    let tailStart = units.length - Math.floor(k / 2);
    if (risky) {
      head = retractHead(units, head);
      tailStart = advanceTail(units, tailStart);
    }
    return units.slice(0, head).join('') + ELLIPSIS + units.slice(tailStart).join('');
  };

  let lo = 0;
  let hi = units.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(compose(mid)) <= budget) lo = mid;
    else hi = mid - 1;
  }

  let candidate = compose(lo);
  while (lo > 0 && measure(candidate) > budget) {
    lo -= 1;
    candidate = compose(lo);
  }
  return measure(candidate) <= budget ? candidate : ELLIPSIS;
}
