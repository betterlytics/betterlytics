import { buildLocaleEntrySelector } from '../locale-helpers';

import * as EnModule from './latest-modal';
import * as DaModule from './latest-modal.da';
import * as ItModule from './latest-modal.it';

const { entries: latestModalEntriesByLocale, getForLocale: getLatestModalForLocale } = buildLocaleEntrySelector({
  en: EnModule,
  da: DaModule,
  it: ItModule,
});

export { latestModalEntriesByLocale, getLatestModalForLocale };
