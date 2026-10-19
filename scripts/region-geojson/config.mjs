export const INFLATION_THRESHOLD = 1.15;
export const LINK_KM = 100;
export const COVERAGE_FLOOR = 0.8;

// Vertex-retention ladders by raw country size
export const SIMPLIFY_TIERS = [
  { maxBytes: 80 * 1024, percentages: [35, 20, 12, 7] },
  { maxBytes: 250 * 1024, percentages: [20, 12, 7, 4] },
  { maxBytes: Infinity, percentages: [12, 7, 4, 2] },
];
// The validator's containment tolerance derives from this output grid
export const SIMPLIFY_PRECISION_DEG = 0.0001;
export const FILE_BUDGET_BYTES = 260 * 1024;
export const TOTAL_BUDGET_BYTES = 6 * 1024 * 1024;

// NE files these under a different country than ISO and MaxMind do
export const countryReassign = {
  'UA-43': 'UA',
  'UA-40': 'UA',
  'FR-GF': 'GF',
  'FR-GP': 'GP',
  'FR-MQ': 'MQ',
  'FR-RE': 'RE',
  'FR-YT': 'YT',
  'NL-BQ1': 'BQ',
  'NL-BQ2': 'BQ',
  'NL-BQ3': 'BQ',
  'NL-SX': 'SX',
  'US-PR': 'PR',
};

// Explicit groupings to MaxMind's first level where NE regions do not line up
export const regionGroups = {
  GB: {
    'GB-ENG': {
      regions: [
        'North West',
        'West Midlands',
        'South West',
        'North East',
        'Yorkshire and the Humber',
        'East Midlands',
        'East',
        'South East',
        'Greater London',
      ],
    },
    'GB-SCT': { regions: ['Eastern', 'South Western', 'Highlands and Islands', 'North Eastern'] },
    'GB-WLS': { regions: ['West Wales and the Valleys', 'East Wales'] },
    'GB-NIR': { regions: ['Northern Ireland'] },
  },
  IE: {
    'IE-C': { ids: ['IE-G', 'IE-LM', 'IE-MO', 'IE-RN', 'IE-SO'] },
    'IE-L': { ids: ['IE-CW', 'IE-D', 'IE-KE', 'IE-KK', 'IE-LS', 'IE-LD', 'IE-LH', 'IE-MH', 'IE-OY', 'IE-WH', 'IE-WX', 'IE-WW'] },
    'IE-M': { ids: ['IE-CE', 'IE-CO', 'IE-KY', 'IE-LK', 'IE-TA', 'IE-WD'] },
    'IE-U': { ids: ['IE-CN', 'IE-DL', 'IE-MN'] },
  },
  NO: {
    'NO-34': { ids: ['NO-04', 'NO-05'] },
    'NO-42': { ids: ['NO-09', 'NO-10'] },
    'NO-46': { ids: ['NO-12', 'NO-14'] },
    'NO-50': { ids: ['NO-16', 'NO-17'] },
  },
};

// Keys are an NE id, "id|name" or a region name; values are MaxMind codes
export const idOverrides = {
  PL: {
    'PL-DS': 'PL-02',
    'PL-MZ': 'PL-14',
    'PL-PK': 'PL-18',
    'PL-PD': 'PL-20',
    'PL-PM': 'PL-22',
    'PL-SL': 'PL-24',
    'PL-WN': 'PL-28',
    'PL-ZP': 'PL-32',
  },
  ES: { 'Foral de Navarra': 'ES-NC', 'Islas Baleares': 'ES-IB' },
  BE: { Flemish: 'BE-VLG', Walloon: 'BE-WAL' },
  MX: { 'MX-DIF': 'MX-CMX' },
  CO: { 'CO-CUN|Bogota': 'CO-DC' },
  TW: { 'TW-TPQ': 'TW-NWT' },
  BQ: { 'NL-BQ1': 'BQ-BO', 'NL-BQ2': 'BQ-SA', 'NL-BQ3': 'BQ-SE' },
};

// Treatment for every flagged country; the validator fails if one has no entry. Feature ids are post-alignment
export const countryConfig = {
  US: {
    insets: [
      { features: ['US-AK'], label: 'Alaska', side: 'bottom', scaleFrac: 0.32 },
      { features: ['US-HI'], label: 'Hawaii', side: 'bottom', maxGapKm: 300 },
    ],
  },
  ES: {
    insets: [{ features: ['ES-CN'], label: 'Canarias', side: 'bottom', align: 'start' }],
  },
  PT: {
    insets: [
      { features: ['PT-20'], label: 'Açores', side: 'left', scaleFrac: 0.42 },
      { features: ['PT-30'], label: 'Madeira', side: 'left', maxGapKm: 200 },
    ],
  },
  DK: {
    insets: [{ features: ['DK-84'], label: 'Bornholm', inside: 'top-right' }],
  },
  BQ: {
    insets: [
      { features: ['BQ-SA'], label: 'Saba', side: 'right' },
      { features: ['BQ-SE'], label: 'Sint Eustatius', side: 'right' },
    ],
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
