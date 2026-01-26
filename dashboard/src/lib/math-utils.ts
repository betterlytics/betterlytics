// Round to fixed precision to avoid SSR/client hydration mismatch
export const round = (n: number, precision = 1000000) =>
  Math.round(n * precision) / precision;

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number,
  startOffset = 0
) {
  const rad = ((angle - 180 - startOffset) * Math.PI) / 180;
  return {
    x: round(cx + r * Math.cos(rad)),
    y: round(cy + r * Math.sin(rad)),
  };
}

export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  startOffset = 0
) {
  const start = polarToCartesian(cx, cy, r, startAngle, startOffset);
  const end = polarToCartesian(cx, cy, r, endAngle, startOffset);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${round(r)} ${round(r)} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
