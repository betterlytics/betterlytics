import { useMemo, useState, type RefObject } from 'react';

import { fitMidEllipsis } from '@/components/text-fit/fit-mid-ellipsis';
import { measureText, resolveFont, subscribeInvalidation } from '@/components/text-fit/text-measurer';
import { useElementWidth } from '@/components/text-fit/use-element-width';
import { useIsomorphicLayoutEffect } from '@/components/text-fit/use-isomorphic-layout-effect';

export function useMidEllipsis(ref: RefObject<HTMLElement | null>, value: string) {
  const width = useElementWidth(ref);
  const [font, setFont] = useState<string>();
  const [epoch, setEpoch] = useState(0);

  useIsomorphicLayoutEffect(() => subscribeInvalidation(() => setEpoch((e) => e + 1)), []);
  useIsomorphicLayoutEffect(() => {
    if (ref.current) setFont(resolveFont(ref.current));
  }, [ref, epoch]);

  /* A font swap keeps the same font string while changing glyph metrics, so the
     fit must recompute on epoch bumps even though epoch is unused in the body. */
  const text = useMemo(() => {
    if (width === undefined || font === undefined) return value;
    return fitMidEllipsis(value, width, (s) => measureText(s, font));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width, font, epoch]);

  return { text, isTruncated: text !== value };
}
