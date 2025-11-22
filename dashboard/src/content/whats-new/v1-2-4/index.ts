import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './v1-2-4';
import * as DaModule from './v1-2-4.da';
import * as ItModule from './v1-2-4.it';

const { entries: v124EntriesByLocale, getForLocale: getV124EntryForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { v124EntriesByLocale, getV124EntryForLocale };
