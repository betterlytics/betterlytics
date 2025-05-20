export function getCampaignSourceColor(sourceName: string): string {

  // For better results, we should probably use a more sophisticated
  // color generation algorithm (for instance, one based on HSL with varying hue)
  let hash = 0;
  for (let i = 0; i < sourceName.length; i++) {
    hash = sourceName.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const r = (hash & 0xFF0000) >> 16;
  const g = (hash & 0x00FF00) >> 8;
  const b = hash & 0x0000FF;
  return `rgb(${r}, ${g}, ${b})`;
}
