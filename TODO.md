# Missing

## Controls
### - Ticks
#### - Min / Max ??
#### - Play 
#### - var Tick position 
#### - hover label and ticks should match

### - Slider click to change not being blocked by map
### - Play / Stop is broken
### - Zoom
### - Color design
### - Add Play/Stop/Pause icons for playback control buttons (Y)

## HoverTooltip should not fly in from left corner

## Add SelectionPopup

## Mouse pointer
### Hover of country
### Hover of controls

## Add TextLayer to countries layer
### Precompute centroids with turf and put into geojson as points in the feature arrays

## Rewrite country layer to a composite layer
<!--
<import { GeoJsonLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core';
import { PathLayer } from '@deck.gl/layers';

export class CountriesLayer extends CompositeLayer<any> {
  renderLayers() {
    const { data, hoveredFeature, clickedFeature, style, visitorDict } = this.props;

    return [
      // Default GeoJson sublayers
      new GeoJsonLayer({
        id: `${this.props.id}-base`,
        data,
        filled: true,
        stroked: true,
        pickable: true,
        pointType: 'text',
        getText: (f) => f.properties.name,
        getTextSize: 12,
        getFillColor: (f) => {
          const iso = f.id as string;
          const visitors = visitorDict[iso] ?? 0;
          return style.originalStyle(visitors).fill;
        },
        getLineColor: (f) => {
          const iso = f.id as string;
          const visitors = visitorDict[iso] ?? 0;
          return style.originalStyle(visitors).line;
        },
        updateTriggers: {
          getFillColor: visitorDict,
          getLineColor: visitorDict,
        },
      }),

      // Highlight overlay as PathLayer
      new PathLayer({
        id: `${this.props.id}-highlight`,
        data: [hoveredFeature, clickedFeature]
          .filter(Boolean)
          .map((feat) => ({
            path: feat.geometry.coordinates,
            properties: feat.properties,
          })),
        getPath: (d) => d.path,
        getColor: (d) =>
          d.properties.id === clickedFeature?.geoVisitor.country_code
            ? style.selectedStyle().line
            : style.hoveredStyle().line,
        getWidth: 3,
        pickable: false,
      }),
    ];
  }
} -->

##