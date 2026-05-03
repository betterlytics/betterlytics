import { TIME_RANGE_SEARCH_PARAMS } from '@/utils/filterSearchParams';

type SearchParamsLike = {
  get: (name: string) => string | null;
};

export function appendTimeRangeSearchParams(
  href: string,
  currentSearchParams: SearchParamsLike | null | undefined,
): string {
  if (!currentSearchParams) {
    return href;
  }

  const url = new URL(href, 'http://placeholder');

  TIME_RANGE_SEARCH_PARAMS.forEach((key) => {
    const value = currentSearchParams.get(key);
    if (value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}${url.hash}`;
}
