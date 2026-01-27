import { memo } from 'react';

/** Zero-width space - not selectable */
export const ZeroWidthSpace = memo(function ZeroWidthSpace() {
  return <span style={{ userSelect: 'none' }}>{'\u200B'}</span>;
});
