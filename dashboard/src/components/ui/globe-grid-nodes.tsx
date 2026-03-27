'use client';

import React from 'react';

interface GlobeNodePoint {
  readonly x: number;
  readonly y: number;
}

type GlobeGridNodesLayer = 'backplates' | 'occluders';

interface GlobeGridNodesProps {
  readonly layer: GlobeGridNodesLayer;
  readonly nodes: ReadonlyArray<GlobeNodePoint>;
  readonly hub: GlobeNodePoint;
  readonly hubFrontRadius: number;
  readonly hubLogoClipId: string;
  readonly logoSrc: string;
}

const SOURCE_BACKPLATE_RADIUS = 12;
const SOURCE_OCCLUDER_RADIUS = 5;
const HUB_BACKPLATE_RADIUS = 20;
const LOGO_SIZE = 28;
const LOGO_OFFSET = LOGO_SIZE / 2;

export function GlobeGridNodes({ layer, nodes, hub, hubFrontRadius, hubLogoClipId, logoSrc }: GlobeGridNodesProps) {
  if (layer === 'backplates') {
    return (
      <g className='globe-grid-backplates'>
        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r='8'
              fill='var(--globe-data-path)'
              opacity='0.4'
              className='animate-ping'
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={SOURCE_BACKPLATE_RADIUS}
              fill='var(--globe-node-bg)'
              stroke='var(--globe-node-border)'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          </g>
        ))}

        <g>
          <circle
            cx={hub.x}
            cy={hub.y}
            r='10'
            fill='var(--globe-data-path)'
            opacity='0.3'
            className='animate-ping'
            style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
          />
          <circle
            cx={hub.x}
            cy={hub.y}
            r={HUB_BACKPLATE_RADIUS}
            fill='var(--globe-node-bg)'
            stroke='var(--globe-data-path)'
            strokeWidth='1.5'
            vectorEffect='non-scaling-stroke'
          />
          <image href={logoSrc} x={hub.x - LOGO_OFFSET} y={hub.y - LOGO_OFFSET} width={LOGO_SIZE} height={LOGO_SIZE} />
        </g>
      </g>
    );
  }

  return (
    <g className='globe-grid-occluders'>
      {nodes.map((node, i) => (
        <circle key={i} cx={node.x} cy={node.y} r={SOURCE_OCCLUDER_RADIUS} fill='var(--globe-data-path)' />
      ))}

      <g>
        <circle cx={hub.x} cy={hub.y} r={hubFrontRadius} fill='var(--globe-node-bg)' />
        <image
          href={logoSrc}
          x={hub.x - LOGO_OFFSET}
          y={hub.y - LOGO_OFFSET}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          clipPath={`url(#${hubLogoClipId})`}
        />
      </g>
    </g>
  );
}
