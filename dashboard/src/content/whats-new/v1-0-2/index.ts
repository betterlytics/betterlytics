import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-0-2';
import * as DaModule from './v1-0-2.da';
import * as ItModule from './v1-0-2.it';

const { entries: v102EntriesByLocale, getForLocale: getV102EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v102EntriesByLocale, getV102EntryForLocale };
