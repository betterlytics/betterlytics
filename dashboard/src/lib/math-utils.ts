export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number,
  startOffset = 0
) {
  const rad = ((angle - 180 - startOffset) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Round to 6 decimal places to avoid SSR hydration mismatch from floating-point precision differences */
function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
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

  return `M ${round(start.x)} ${round(start.y)} A ${r} ${r} 0 ${largeArcFlag} 1 ${round(end.x)} ${round(end.y)}`;
}
