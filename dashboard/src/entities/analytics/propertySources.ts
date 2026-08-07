export const PROPERTY_SOURCES = {
  gp: { source: 'gp', prefix: 'gp.', labelKey: 'globalProperties' },
  cep: { source: 'cep', prefix: 'cep.', labelKey: 'customEventProperties' },
} as const;

export type PropertySourceKind = keyof typeof PROPERTY_SOURCES;

export const PROPERTY_SOURCE_LIST = Object.values(PROPERTY_SOURCES);

/** The source keys as a zod-enum-ready tuple, derived from the registry so it never drifts. */
export const PROPERTY_SOURCE_KINDS = PROPERTY_SOURCE_LIST.map(({ source }) => source) as [
  PropertySourceKind,
  ...PropertySourceKind[],
];

export type PropertyKeysBySource = Record<PropertySourceKind, string[] | undefined>;

/** Returns the source whose prefix the given raw string matches, or null. */
export function detectPropertySource(value: string): PropertySourceKind | null {
  for (const { source, prefix } of PROPERTY_SOURCE_LIST) {
    if (value.startsWith(prefix)) return source;
  }
  return null;
}
