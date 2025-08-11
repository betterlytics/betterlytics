import { GeoVisitor } from '@/entities/geography';

export const BACKGROUND_WORLD = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-230, -120],
        [230, -120],
        [230, 120],
        [-230, 120],
        [-230, -120],
      ],
    ],
  },
} as const;

export const MOCK_WORLD_GEOVISITORS: GeoVisitor[] = [
  {
    country_code: 'BE',
    visitors: 3412,
  },
  {
    country_code: 'US',
    visitors: 3328,
  },
  {
    country_code: 'IS',
    visitors: 3083,
  },
  {
    country_code: 'CH',
    visitors: 3082,
  },
  {
    country_code: 'FI',
    visitors: 3002,
  },
  {
    country_code: 'GB',
    visitors: 2997,
  },
  {
    country_code: 'FR',
    visitors: 2955,
  },
  {
    country_code: 'PL',
    visitors: 2898,
  },
  {
    country_code: 'SE',
    visitors: 2895,
  },
  {
    country_code: 'HU',
    visitors: 2851,
  },
  {
    country_code: 'LV',
    visitors: 2707,
  },
  {
    country_code: 'NL',
    visitors: 2675,
  },
  {
    country_code: 'BG',
    visitors: 2657,
  },
  {
    country_code: 'DK',
    visitors: 2452,
  },
  {
    country_code: 'IN',
    visitors: 2423,
  },
  {
    country_code: 'MT',
    visitors: 2333,
  },
  {
    country_code: 'LT',
    visitors: 2300,
  },
  {
    country_code: 'SI',
    visitors: 2253,
  },
  {
    country_code: 'LI',
    visitors: 2140,
  },
  {
    country_code: 'UA',
    visitors: 2068,
  },
  {
    country_code: 'GR',
    visitors: 2067,
  },
  {
    country_code: 'ES',
    visitors: 2049,
  },
  {
    country_code: 'PT',
    visitors: 1995,
  },
  {
    country_code: 'HR',
    visitors: 1987,
  },
  {
    country_code: 'SK',
    visitors: 1982,
  },
  {
    country_code: 'TZ',
    visitors: 1941,
  },
  {
    country_code: 'ZM',
    visitors: 1931,
  },
  {
    country_code: 'DE',
    visitors: 1897,
  },
  {
    country_code: 'IT',
    visitors: 1874,
  },
  {
    country_code: 'AT',
    visitors: 1864,
  },
  {
    country_code: 'CZ',
    visitors: 1787,
  },
  {
    country_code: 'EG',
    visitors: 1766,
  },
  {
    country_code: 'PK',
    visitors: 1742,
  },
  {
    country_code: 'GH',
    visitors: 1714,
  },
  {
    country_code: 'EE',
    visitors: 1656,
  },
  {
    country_code: 'IE',
    visitors: 1595,
  },
  {
    country_code: 'NO',
    visitors: 1549,
  },
  {
    country_code: 'LU',
    visitors: 1529,
  },
  {
    country_code: 'KE',
    visitors: 1418,
  },
  {
    country_code: 'PH',
    visitors: 1284,
  },
  {
    country_code: 'SO',
    visitors: 1238,
  },
  {
    country_code: 'NG',
    visitors: 1223,
  },
  {
    country_code: 'RU',
    visitors: 1203,
  },
  {
    country_code: 'AE',
    visitors: 994,
  },
  {
    country_code: 'VI',
    visitors: 970,
  },
  {
    country_code: 'LA',
    visitors: 956,
  },
  {
    country_code: 'GT',
    visitors: 955,
  },
  {
    country_code: 'UG',
    visitors: 955,
  },
  {
    country_code: 'AU',
    visitors: 951,
  },
  {
    country_code: 'MG',
    visitors: 947,
  },
  {
    country_code: 'NP',
    visitors: 947,
  },
  {
    country_code: 'KI',
    visitors: 942,
  },
  {
    country_code: 'PY',
    visitors: 941,
  },
  {
    country_code: 'LY',
    visitors: 940,
  },
  {
    country_code: 'MR',
    visitors: 937,
  },
  {
    country_code: 'KH',
    visitors: 933,
  },
  {
    country_code: 'FO',
    visitors: 931,
  },
  {
    country_code: 'CR',
    visitors: 922,
  },
  {
    country_code: 'TD',
    visitors: 918,
  },
  {
    country_code: 'KN',
    visitors: 917,
  },
  {
    country_code: 'MY',
    visitors: 916,
  },
  {
    country_code: 'BQ',
    visitors: 900,
  },
  {
    country_code: 'QA',
    visitors: 895,
  },
  {
    country_code: 'SZ',
    visitors: 894,
  },
  {
    country_code: 'VE',
    visitors: 892,
  },
  {
    country_code: 'PG',
    visitors: 888,
  },
  {
    country_code: 'TK',
    visitors: 881,
  },
  {
    country_code: 'AL',
    visitors: 875,
  },
  {
    country_code: 'GE',
    visitors: 867,
  },
  {
    country_code: 'NE',
    visitors: 852,
  },
  {
    country_code: 'GQ',
    visitors: 850,
  },
  {
    country_code: 'MS',
    visitors: 845,
  },
  {
    country_code: 'KG',
    visitors: 843,
  },
  {
    country_code: 'NZ',
    visitors: 828,
  },
  {
    country_code: 'LS',
    visitors: 825,
  },
  {
    country_code: 'AZ',
    visitors: 823,
  },
  {
    country_code: 'LB',
    visitors: 804,
  },
  {
    country_code: 'CU',
    visitors: 803,
  },
  {
    country_code: 'PM',
    visitors: 800,
  },
  {
    country_code: 'VA',
    visitors: 796,
  },
  {
    country_code: 'GI',
    visitors: 786,
  },
  {
    country_code: 'TR',
    visitors: 786,
  },
  {
    country_code: 'PE',
    visitors: 785,
  },
  {
    country_code: 'VU',
    visitors: 783,
  },
  {
    country_code: 'CM',
    visitors: 782,
  },
  {
    country_code: 'TN',
    visitors: 775,
  },
  {
    country_code: 'BM',
    visitors: 773,
  },
  {
    country_code: 'MX',
    visitors: 760,
  },
  {
    country_code: 'KY',
    visitors: 758,
  },
  {
    country_code: 'BI',
    visitors: 756,
  },
  {
    country_code: 'MA',
    visitors: 756,
  },
  {
    country_code: 'TT',
    visitors: 753,
  },
  {
    country_code: 'HN',
    visitors: 752,
  },
  {
    country_code: 'GA',
    visitors: 750,
  },
  {
    country_code: 'RS',
    visitors: 746,
  },
  {
    country_code: 'CN',
    visitors: 744,
  },
  {
    country_code: 'CO',
    visitors: 738,
  },
  {
    country_code: 'FM',
    visitors: 738,
  },
  {
    country_code: 'ST',
    visitors: 732,
  },
  {
    country_code: 'AI',
    visitors: 731,
  },
  {
    country_code: 'CD',
    visitors: 720,
  },
  {
    country_code: 'GU',
    visitors: 718,
  },
  {
    country_code: 'BN',
    visitors: 717,
  },
  {
    country_code: 'AF',
    visitors: 712,
  },
  {
    country_code: 'PS',
    visitors: 712,
  },
  {
    country_code: 'VG',
    visitors: 711,
  },
  {
    country_code: 'GF',
    visitors: 702,
  },
  {
    country_code: 'CC',
    visitors: 691,
  },
  {
    country_code: 'ID',
    visitors: 684,
  },
  {
    country_code: 'SJ',
    visitors: 683,
  },
  {
    country_code: 'MD',
    visitors: 682,
  },
  {
    country_code: 'BY',
    visitors: 675,
  },
  {
    country_code: 'LR',
    visitors: 669,
  },
  {
    country_code: 'MK',
    visitors: 669,
  },
  {
    country_code: 'IR',
    visitors: 664,
  },
  {
    country_code: 'PW',
    visitors: 660,
  },
  {
    country_code: 'MU',
    visitors: 659,
  },
  {
    country_code: 'BJ',
    visitors: 658,
  },
  {
    country_code: 'MO',
    visitors: 655,
  },
  {
    country_code: 'PR',
    visitors: 647,
  },
  {
    country_code: 'SM',
    visitors: 647,
  },
  {
    country_code: 'KR',
    visitors: 640,
  },
  {
    country_code: 'GM',
    visitors: 633,
  },
  {
    country_code: 'IL',
    visitors: 629,
  },
  {
    country_code: 'AW',
    visitors: 619,
  },
  {
    country_code: 'IO',
    visitors: 604,
  },
  {
    country_code: 'DJ',
    visitors: 602,
  },
  {
    country_code: 'AS',
    visitors: 595,
  },
  {
    country_code: 'JM',
    visitors: 595,
  },
  {
    country_code: 'JO',
    visitors: 595,
  },
  {
    country_code: 'LC',
    visitors: 593,
  },
  {
    country_code: 'SC',
    visitors: 591,
  },
  {
    country_code: 'NF',
    visitors: 589,
  },
  {
    country_code: 'CG',
    visitors: 587,
  },
  {
    country_code: 'BZ',
    visitors: 573,
  },
  {
    country_code: 'XK',
    visitors: 571,
  },
  {
    country_code: 'TA',
    visitors: 567,
  },
  {
    country_code: 'MC',
    visitors: 543,
  },
  {
    country_code: 'FK',
    visitors: 542,
  },
  {
    country_code: 'TM',
    visitors: 542,
  },
  {
    country_code: 'EH',
    visitors: 541,
  },
  {
    country_code: 'EC',
    visitors: 533,
  },
  {
    country_code: 'SR',
    visitors: 528,
  },
  {
    country_code: 'AM',
    visitors: 527,
  },
  {
    country_code: 'GP',
    visitors: 521,
  },
  {
    country_code: 'IM',
    visitors: 518,
  },
  {
    country_code: 'ML',
    visitors: 516,
  },
  {
    country_code: 'AD',
    visitors: 496,
  },
  {
    country_code: 'UZ',
    visitors: 496,
  },
  {
    country_code: 'MN',
    visitors: 493,
  },
  {
    country_code: 'ET',
    visitors: 486,
  },
  {
    country_code: 'ME',
    visitors: 484,
  },
  {
    country_code: 'LK',
    visitors: 479,
  },
  {
    country_code: 'MP',
    visitors: 477,
  },
  {
    country_code: 'BT',
    visitors: 474,
  },
  {
    country_code: 'NU',
    visitors: 469,
  },
  {
    country_code: 'GY',
    visitors: 465,
  },
  {
    country_code: 'SN',
    visitors: 465,
  },
  {
    country_code: 'AO',
    visitors: 458,
  },
  {
    country_code: 'MZ',
    visitors: 455,
  },
  {
    country_code: 'DM',
    visitors: 450,
  },
  {
    country_code: 'ZA',
    visitors: 449,
  },
  {
    country_code: 'UY',
    visitors: 428,
  },
  {
    country_code: 'SH',
    visitors: 420,
  },
  {
    country_code: 'BO',
    visitors: 416,
  },
  {
    country_code: 'BR',
    visitors: 411,
  },
  {
    country_code: 'UM',
    visitors: 409,
  },
  {
    country_code: 'YT',
    visitors: 402,
  },
  {
    country_code: 'JE',
    visitors: 392,
  },
  {
    country_code: 'RO',
    visitors: 391,
  },
  {
    country_code: 'DZ',
    visitors: 390,
  },
  {
    country_code: 'AC',
    visitors: 386,
  },
  {
    country_code: 'CK',
    visitors: 378,
  },
  {
    country_code: 'EU',
    visitors: 373,
  },
  {
    country_code: 'MW',
    visitors: 373,
  },
  {
    country_code: 'TW',
    visitors: 369,
  },
  {
    country_code: 'MH',
    visitors: 366,
  },
  {
    country_code: 'BL',
    visitors: 364,
  },
  {
    country_code: 'BH',
    visitors: 358,
  },
  {
    country_code: 'HK',
    visitors: 357,
  },
  {
    country_code: 'VN',
    visitors: 355,
  },
  {
    country_code: 'CX',
    visitors: 353,
  },
  {
    country_code: 'KW',
    visitors: 352,
  },
  {
    country_code: 'SD',
    visitors: 346,
  },
  {
    country_code: 'GL',
    visitors: 340,
  },
  {
    country_code: 'CA',
    visitors: 337,
  },
  {
    country_code: 'NA',
    visitors: 337,
  },
  {
    country_code: 'RE',
    visitors: 337,
  },
  {
    country_code: 'WF',
    visitors: 328,
  },
  {
    country_code: 'BV',
    visitors: 327,
  },
  {
    country_code: 'TJ',
    visitors: 327,
  },
  {
    country_code: 'PF',
    visitors: 321,
  },
  {
    country_code: 'CV',
    visitors: 317,
  },
  {
    country_code: 'PA',
    visitors: 315,
  },
  {
    country_code: 'HM',
    visitors: 305,
  },
  {
    country_code: 'CL',
    visitors: 302,
  },
  {
    country_code: 'TG',
    visitors: 297,
  },
  {
    country_code: 'HT',
    visitors: 293,
  },
  {
    country_code: 'CY',
    visitors: 292,
  },
  {
    country_code: 'TL',
    visitors: 284,
  },
  {
    country_code: 'TH',
    visitors: 275,
  },
  {
    country_code: 'SX',
    visitors: 272,
  },
  {
    country_code: 'TO',
    visitors: 269,
  },
  {
    country_code: 'DO',
    visitors: 264,
  },
  {
    country_code: 'AR',
    visitors: 256,
  },
  {
    country_code: 'IQ',
    visitors: 256,
  },
  {
    country_code: 'BB',
    visitors: 255,
  },
  {
    country_code: 'ZW',
    visitors: 254,
  },
  {
    country_code: 'MV',
    visitors: 249,
  },
  {
    country_code: 'SV',
    visitors: 246,
  },
  {
    country_code: 'SA',
    visitors: 245,
  },
  {
    country_code: 'CI',
    visitors: 241,
  },
  {
    country_code: 'MM',
    visitors: 241,
  },
  {
    country_code: 'AX',
    visitors: 228,
  },
  {
    country_code: 'BF',
    visitors: 205,
  },
  {
    country_code: 'BW',
    visitors: 204,
  },
  {
    country_code: 'SB',
    visitors: 204,
  },
  {
    country_code: 'NI',
    visitors: 203,
  },
  {
    country_code: 'PN',
    visitors: 202,
  },
  {
    country_code: 'BD',
    visitors: 199,
  },
  {
    country_code: 'SG',
    visitors: 196,
  },
  {
    country_code: 'AG',
    visitors: 179,
  },
  {
    country_code: 'FJ',
    visitors: 177,
  },
  {
    country_code: 'OM',
    visitors: 171,
  },
  {
    country_code: 'BA',
    visitors: 168,
  },
  {
    country_code: 'SL',
    visitors: 165,
  },
  {
    country_code: 'MQ',
    visitors: 162,
  },
  {
    country_code: 'BS',
    visitors: 150,
  },
  {
    country_code: 'VC',
    visitors: 149,
  },
  {
    country_code: 'KZ',
    visitors: 147,
  },
  {
    country_code: 'JP',
    visitors: 146,
  },
  {
    country_code: 'IC',
    visitors: 141,
  },
  {
    country_code: 'CW',
    visitors: 139,
  },
  {
    country_code: 'GG',
    visitors: 134,
  },
  {
    country_code: 'RW',
    visitors: 129,
  },
  {
    country_code: 'NC',
    visitors: 128,
  },
  {
    country_code: 'GS',
    visitors: 124,
  },
  {
    country_code: 'KM',
    visitors: 124,
  },
  {
    country_code: 'GD',
    visitors: 122,
  },
  {
    country_code: 'TC',
    visitors: 122,
  },
  {
    country_code: 'TF',
    visitors: 122,
  },
  {
    country_code: 'MF',
    visitors: 121,
  },
  {
    country_code: 'AQ',
    visitors: 0,
  },
  {
    country_code: 'CF',
    visitors: 0,
  },
  {
    country_code: 'ER',
    visitors: 0,
  },
  {
    country_code: 'GN',
    visitors: 0,
  },
  {
    country_code: 'GW',
    visitors: 0,
  },
  {
    country_code: 'KP',
    visitors: 0,
  },
  {
    country_code: 'NR',
    visitors: 0,
  },
  {
    country_code: 'SS',
    visitors: 0,
  },
  {
    country_code: 'SY',
    visitors: 0,
  },
  {
    country_code: 'TV',
    visitors: 0,
  },
  {
    country_code: 'WS',
    visitors: 0,
  },
  {
    country_code: 'YE',
    visitors: 0,
  },
] as const;
