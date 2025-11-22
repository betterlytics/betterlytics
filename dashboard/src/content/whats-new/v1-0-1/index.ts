import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-0-1';
import * as DaModule from './v1-0-1.da';
import * as ItModule from './v1-0-1.it';

const { entries: v101EntriesByLocale, getForLocale: getV101EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v101EntriesByLocale, getV101EntryForLocale };
