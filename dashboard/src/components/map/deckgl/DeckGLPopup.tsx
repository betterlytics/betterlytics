import { WebMercatorViewport } from '@deck.gl/core';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';

interface DeckGLPopupProps {
  viewState: any; // the DeckGL viewState
  children?: React.ReactNode;
}

export function DeckGLPopup({ viewState, children }: DeckGLPopupProps) {
  const { clickedFeature } = useMapSelection();

  if (!clickedFeature) return null;

  const viewport = new WebMercatorViewport(viewState);

  const featureLatLng: [number, number] = [clickedFeature.longitude ?? 0, clickedFeature.latitude ?? 0];

  const [x, y] = viewport.project(featureLatLng);

  return (
    <div
      className='absolute z-50'
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'auto',
      }}
    >
      <div className='rounded-xl bg-white p-3 shadow-lg'>
        <h3 className='mb-1 text-sm font-bold'>Country: {clickedFeature.geoVisitor.country_code}</h3>
        {children}
      </div>
    </div>
  );
}
