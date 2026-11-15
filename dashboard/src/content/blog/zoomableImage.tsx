'use client';

import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import styles from './zoomableImage.module.css';

type ZoomableImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export function ZoomableImage({ src, alt, width, height }: ZoomableImageProps) {
  return (
    <Zoom
      classDialog={styles.dialog}
      zoomMargin={16}
      a11yNameButtonZoom='Zoom image'
      a11yNameButtonUnzoom='Close image'
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static diagrams, sized by their width/height attributes */}
      <img src={src} alt={alt} width={width} height={height} loading='lazy' decoding='async' />
    </Zoom>
  );
}
