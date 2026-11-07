/* Generated from public/data/countries.geo.json: land on a 2° grid from 76°N to 56°S, equirectangular. */

export const MAP_COLS = 180;
export const MAP_ROWS = 66;
export const MAP_COUNTRIES = ['IN', 'BR', 'JP', 'US', 'GB', 'DE'] as const;

/** Each country's main landmass, in cells: its centre and half its width and height. */
export const MAP_ANCHORS = {
  IN: [129.5, 27, 5.5, 7],
  BR: [63, 45.5, 10, 9.5],
  JP: [159, 19, 4, 4],
  US: [42, 19, 14, 6],
  GB: [88.5, 10.5, 2.5, 2.5],
  DE: [95, 12.5, 2, 1.5],
} as const;

/**
 * The grid row by row from the north-west, as runs: a letter for the cells' kind (a sea, b other land, then one
 * per MAP_COUNTRIES entry in order) and the run's length when it's more than one.
 */
export const MAP_RUNS =
  'a32b5a2b2abab6a11b19a38b3a12b14a12b3a45b8ab2ab5ab7a10b17a37b3a6ba4b24a6b2a18ba9f4a14b2ab7a2bab2ab10a8b16a23b3a11b2a5b47a10ba6f13b19ab6ab3ab5a7b15a20b11a10b65a4f12b29a4b6a4b10a24b14ab68a2b2a2f14b29a2b7a6b6a8b5a12b6ab6ab71a7f13b25a2b2a5b4a6b5a24b7ab79a7f13b23a8b4a10b4a23b7a2b67a2b7a12f4afa5fbfb20a8b5ab2a28ga5b6a3b65a3b2a18f2afa9fb22a5b8a28g2a5bab2a3b59a8b4a32fb24ab11a25g4a4b3ab61a9b3a34b24ab12a23b2g4abh4b65a6b2a36b36a25g4b2h4b65a45b13f3b15a3b2a25b6h3b63aba46f19b8fb2a4b2a25b70a2ba46f21b4f3b4a29b16ab2ab5ab44ae2a46f21bf5a30b8a2b2ab6a6b4a2b41a3e3a45f26a31b6a3bab19a2b38a5ea47f25a32b5a8bab2ab12a2b32a3b2a6ea48f23a34b3a2b4a2ba3ba2b47a2b2a3e3a48f23a35b8a13b20cb21a3b2e6a50f19a35b12a3ba6b20c2b22a4e3a54b5f13a35b14ab27c3b21a4ea56b8f3afa3f2a34b30ab11c4b7cb13a62bab5f2a7fa33b24ab7ab9c7b2cbc2b12a64bab5a41b34ab2ab5c9b2cb14a66b4a8ba32b26ab11a4c10b2cb11a2ba66b5a3b2a3b3a28b28ab10a5c9a2b8aba72b5ab2a7b2a27b27ab9a7c7a4b6aba74b7a36b28ab7a8c5a6b7a6ba72b5a33b35a11c3a9b6a5ba74b3a33b32a14c3a9b6a5b2a75ba4b4a2ba23b30ab3a12c2a9bab3a7b2a75b12a23b32a13cb2a8ba11b2a78b10a23b31a15ba9ba11ba78b13a21b5a2b22a24bab2a5b2a82b7d2b4da30b19a24b4a4b3a81b5d10a29b18a27b3a2b5aba78b6d12a27b17a29b2a3b4aba5ba73b5d15a25b15a31b2a2b3ab2a3bab6a67b5d18a24b14a32ba8ba6b5a2ba64b3d20a23b14a33b4a12b5a66b3d20a23b14a42ba7b2ab2a66b4dbd15a25b13a121b8d12a25b14a4ba40b3a3ba70b8d11a25b14a3b2a37b6a3b2a71b7d10a25b14a2b3a36b12a72b6d9a26b12a4b3a35b14a71b6d9a27b11a4b2a34b17a7ba62b7d7a28b11a4b2a33b19a68b9d3a31b10a5b2a33b19a68b9d3a31b10a40b20a67b8d4a32b8a41b20a67b8d3a34b6a42b20a67b9da35b5a44b5a4b9a68b9a85ba10b7a67b9a98b5a12ba55b8a100ba15b2a54b6a103b2a12b2a55b5a105ba11b2a56b4a116b3a56b5a117ba57b5a175b4a4ba172b3a178b3a123';
