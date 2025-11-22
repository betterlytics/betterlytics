import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-0-0';
import * as DaModule from './v1-0-0.da';
import * as ItModule from './v1-0-0.it';

const { entries: v100EntriesByLocale, getForLocale: getV100EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v100EntriesByLocale, getV100EntryForLocale };
