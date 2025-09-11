import { useEffect } from 'react';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';

export function DeckGLBackgroundEvents({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { setMapSelection } = useMapSelection();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const clearHovered = () => {
      setMapSelection({ hovered: undefined });
    };

    container.addEventListener('mouseleave', clearHovered);
    container.addEventListener('blur', () => setMapSelection(null));

    return () => {
      container.removeEventListener('mouseleave', clearHovered);
      container.removeEventListener('blur', () => setMapSelection(null));
    };
  }, [containerRef, setMapSelection]);

  return null;
}
