import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v0-1-0';
import * as DaModule from './v0-1-0.da';
import * as ItModule from './v0-1-0.it';

const { entries: v010EntriesByLocale, getForLocale: getV010EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v010EntriesByLocale, getV010EntryForLocale };
