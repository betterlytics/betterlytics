import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-2-2';
import * as DaModule from './v1-2-2.da';
import * as ItModule from './v1-2-2.it';

const { entries: v122EntriesByLocale, getForLocale: getV122EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v122EntriesByLocale, getV122EntryForLocale };
