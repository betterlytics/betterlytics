export const INFLATION_THRESHOLD = 1.15;
export const LINK_KM = 100;

/** Vertex-retention ladders by raw country size: small countries keep more detail per vertex. */
export const SIMPLIFY_TIERS = [
  { maxBytes: 80 * 1024, percentages: [35, 20, 12, 7] },
  { maxBytes: 250 * 1024, percentages: [20, 12, 7, 4] },
  { maxBytes: Infinity, percentages: [12, 7, 4, 2] },
];
export const FILE_BUDGET_BYTES = 260 * 1024;
export const TOTAL_BUDGET_BYTES = 6 * 1024 * 1024;

/**
 * Treatment for every country the analysis pass flags (inflation > threshold
 * or antimeridian-shifted). The validator fails if a flagged country has no
 * entry, so a Natural Earth update introducing a new problem country is caught.
 *
 * - insets: detached parts of the listed features are scaled into framed boxes
 *   stacked along a side of the mainland, following each country's national
 *   map convention (d3-composite-projections layouts where one exists).
 *   wholeFeature: true boxes every part of the feature, including parts that
 *   cluster with the mainland (Okinawa chains to Kyushu in <100km hops).
 *   inside: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' places the
 *   frame within the anchor bbox corner instead of outside it - frames must land
 *   on empty sea; the frame-collision validator enforces it.
 * - crop: detached parts of the listed features are dropped from the map.
 *   Only for uninhabited specks or conventional omissions; the region list
 *   under the map stays complete regardless.
 * - keepAll: render everything in place. Archipelago nations where the wide
 *   extent IS the country, or where antimeridian normalization alone fixes it.
 *
 * Feature ids here are post-remap (current ISO via CLDR), not raw NE ids.
 */
/** Crimea and Sevastopol: NE groups them under RU; ISO, CLDR, and MaxMind file them under Ukraine. */
export const countryReassign = { 'UA-43': 'UA', 'UA-40': 'UA' };

/** Cross-country NE ids with no matchable ISO code in their own file; explicit pseudo ids. */
export const idOverrides = { 'US-PR': 'PR-X00~', 'NL-SX': 'SX-X00~' };

export const countryConfig = {
  FR: {
    // INSEE convention: single DROM column left; mainland centering comes from viewBbox
    insets: [
      { features: ['FR-971'], label: 'Guadeloupe', side: 'left', scaleFrac: 0.16 },
      { features: ['FR-972'], label: 'Martinique', side: 'left', scaleFrac: 0.16 },
      { features: ['FR-973'], label: 'Guyane', side: 'left', scaleFrac: 0.16 },
      { features: ['FR-974'], label: 'La Réunion', side: 'left', scaleFrac: 0.16 },
      { features: ['FR-976'], label: 'Mayotte', side: 'left', scaleFrac: 0.16 },
    ],
  },
  US: {
    insets: [
      { features: ['US-AK'], label: 'Alaska', side: 'bottom', scaleFrac: 0.32 },
      { features: ['US-HI'], label: 'Hawaii', side: 'bottom', maxGapKm: 300 },
    ],
  },
  ES: {
    insets: [{ features: ['ES-TF', 'ES-GC'], label: 'Canarias', side: 'bottom', align: 'start' }],
  },
  PT: {
    insets: [
      { features: ['PT-20'], label: 'Açores', side: 'left', scaleFrac: 0.42 },
      { features: ['PT-30'], label: 'Madeira', side: 'left', maxGapKm: 200 },
    ],
  },
  NL: {
    insets: [
      { features: ['NL-BQ1'], label: 'Bonaire', side: 'left', scaleFrac: 0.14 },
      { features: ['NL-BQ2'], label: 'Saba', side: 'left', scaleFrac: 0.14 },
      { features: ['NL-BQ3'], label: 'Sint Eustatius', side: 'left', scaleFrac: 0.14 },
    ],
  },
  DK: {
    insets: [{ features: ['DK-84'], label: 'Bornholm', inside: 'top-right' }],
  },
  JP: {
    insets: [{ features: ['JP-47'], label: 'Okinawa', inside: 'top-left', wholeFeature: true, scaleFrac: 0.45 }],
    crop: [{ features: ['JP-13'], note: 'Ogasawara and outer Izu islands, conventionally omitted' }],
  },
  EC: {
    insets: [{ features: ['EC-W'], label: 'Galápagos', side: 'left' }],
  },
  GQ: {
    insets: [{ features: ['GQ-AN'], label: 'Annobón', side: 'left' }],
    note: 'Bioko stays in place per convention (unmatched detached clusters are kept)',
  },
  MU: {
    insets: [
      { features: ['MU-RO'], label: 'Rodrigues', side: 'right' },
      { features: ['MU-AG'], label: 'Agaléga', side: 'right' },
    ],
  },
  SH: {
    insets: [
      { features: ['SH-AC'], label: 'Ascension', side: 'left' },
      { features: ['SH-TA'], label: 'Tristan da Cunha', side: 'left', maxGapKm: 250 },
    ],
  },
  NO: {
    crop: [{ features: ['NO-21', 'NO-X01~', 'NO-18'], note: 'Svalbard, Bouvet, Jan Mayen; conventional omissions' }],
  },
  ZA: {
    crop: [{ features: ['ZA-WC'], note: 'Prince Edward Islands, uninhabited parts of Western Cape' }],
  },
  CR: {
    crop: [{ features: ['CR-P'], note: 'Cocos Island, uninhabited part of Puntarenas' }],
  },
  AU: {
    crop: [{ features: ['AU-X03~', 'AU-X04~', 'AU-NSW'], note: 'Macquarie, Ashmore, Lord Howe specks' }],
  },
  NZ: {
    crop: [
      {
        features: ['NZ-CIT', 'NZ-X01~', 'NZ-X04~', 'NZ-X05~', 'NZ-X06~', 'NZ-X07~'],
        note: 'Chathams and outer islands, conventionally omitted',
      },
    ],
  },
  CL: {
    crop: [{ features: ['CL-VS'], note: 'Easter Island group, detached parts of Valparaíso' }],
  },

  RU: { keepAll: true, note: 'antimeridian normalization alone fixes it; Kaliningrad always drawn in place' },
  FJ: { keepAll: true, note: 'normalization fixes the split; Rotuma stays in place' },
  MY: { keepAll: true, note: 'two halves at x1.77 is the honest map' },
  TW: { keepAll: true },
  KY: { keepAll: true },
  ST: { keepAll: true },
  CV: { keepAll: true },
  MV: { keepAll: true },
  TO: { keepAll: true },
  TV: { keepAll: true },
  WF: { keepAll: true },
  AS: { keepAll: true },
  SB: { keepAll: true },
  MP: { keepAll: true },
  PW: { keepAll: true },
  GS: { keepAll: true },
  UM: { keepAll: true },
  KI: { keepAll: true },
  FM: { keepAll: true },
  MH: { keepAll: true },
  CK: { keepAll: true },
  PN: { keepAll: true },
  TK: { keepAll: true },
  TF: { keepAll: true },
  SC: { keepAll: true },
  PF: { keepAll: true },
  IO: { keepAll: true },
};
