import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-2-0';
import * as DaModule from './v1-2-0.da';
import * as ItModule from './v1-2-0.it';

const { entries: v120EntriesByLocale, getForLocale: getV120EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v120EntriesByLocale, getV120EntryForLocale };
