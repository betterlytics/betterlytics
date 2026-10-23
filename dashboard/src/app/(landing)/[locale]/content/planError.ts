/* Mock data, deliberately untranslated: the bug the error illustrations follow. Files are served as written, since there are no source maps. */
export const PLAN_ERROR = {
  type: 'TypeError',
  message: "Cannot read properties of null (reading 'plan')",
  frames: [
    { line: 142, fn: 'selectPlan', file: 'pricing.js', col: 19 },
    { line: 61, fn: 'onClick', file: 'plan-card.js', col: 7 },
    { line: 18, fn: 'handleClick', file: 'plan-card.js', col: 5 },
  ],
};
