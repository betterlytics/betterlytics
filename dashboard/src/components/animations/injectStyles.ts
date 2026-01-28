const STYLE_ID = "ba-number-roll-styles";
let injected = false;

export function injectStyles(css: string): void {
  // SSR guard - no DOM during server render
  if (typeof document === "undefined") return;

  // Only inject once, even with multiple component instances
  if (injected) return;
  injected = true;

  // Check if already in DOM (e.g., from a previous page load in dev)
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}
